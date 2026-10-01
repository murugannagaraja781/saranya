import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/index';
import { messageProcessor } from '../services/messageProcessor';
import { firestoreService } from '../services/db/firestoreService';
import { InboundMessagePayload, PostCallWebhookPayload } from '../types/shared';

export class WebhookController {
  /**
   * Primary n8n Webhook Ingestion Endpoint
   * POST /api/webhooks/n8n/message
   */
  public async handleN8NWebhook(req: Request, res: Response): Promise<void> {
    const requestId = req.headers['x-request-id'] as string;
    const authSecret = req.headers['x-n8n-secret'] || req.query.secret;

    if (config.n8nWebhookSecret && authSecret !== config.n8nWebhookSecret) {
      logger.warn('Unauthorized n8n webhook attempt with invalid secret', { requestId });
      res.status(401).json({ error: 'Unauthorized. Invalid x-n8n-secret header.' });
      return;
    }

    try {
      const body = req.body;
      if (!body || !body.message) {
        res.status(400).json({ error: 'Bad Request: "message" payload field is required.' });
        return;
      }

      const payload: InboundMessagePayload = {
        channel: body.channel === 'whatsapp' ? 'whatsapp' : 'email',
        clientName: body.clientName || body.senderName || 'Client',
        clientContact: body.clientContact || body.sender || '',
        company: body.company || '',
        subject: body.subject || '',
        message: body.message,
        sourceMessageId: body.sourceMessageId || body.id,
        timestamp: body.timestamp || new Date().toISOString(),
        idempotencyKey: body.idempotencyKey || req.headers['x-idempotency-key'] as string
      };

      const result = await messageProcessor.processInbound(payload);

      res.status(200).json({
        success: true,
        messageId: result.message.id,
        should_call: result.analysis.should_call,
        priority: result.analysis.priority,
        callTriggered: result.callTriggered,
        callId: result.call?.id,
        taskId: result.task?.id,
        analysis: result.analysis
      });
    } catch (error) {
      logger.error('Error handling n8n webhook', error, { requestId });
      res.status(500).json({ error: 'Internal processing error' });
    }
  }

  /**
   * Direct Gmail Webhook
   * POST /api/webhooks/gmail
   */
  public async handleGmailWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const payload: InboundMessagePayload = {
        channel: 'email',
        clientName: body.fromName || body.from?.split('<')[0]?.trim() || 'Email Client',
        clientContact: body.fromEmail || body.from || '',
        company: body.company || '',
        subject: body.subject || '',
        message: body.body || body.snippet || body.message || '',
        sourceMessageId: body.messageId || body.id,
        idempotencyKey: body.messageId
      };

      const result = await messageProcessor.processInbound(payload);
      res.status(200).json({ success: true, result });
    } catch (error) {
      logger.error('Error in Gmail webhook handler', error);
      res.status(500).json({ error: 'Internal error processing Gmail message' });
    }
  }

  /**
   * WhatsApp Business Cloud API Webhook
   * GET verification + POST incoming messages
   */
  public verifyWhatsAppWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.whatsappWebhookVerifyToken) {
      logger.info('WhatsApp webhook verify challenge succeeded');
      res.status(200).send(challenge);
      return;
    }

    res.status(403).json({ error: 'Verification failed' });
  }

  public async handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
    try {
      const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
      if (!entry || !entry.messages || entry.messages.length === 0) {
        // Status updates or read receipts, acknowledge immediately
        res.status(200).json({ status: 'ignored_non_message_event' });
        return;
      }

      const waMsg = entry.messages[0];
      const contact = entry.contacts?.[0];

      const payload: InboundMessagePayload = {
        channel: 'whatsapp',
        clientName: contact?.profile?.name || waMsg.from,
        clientContact: waMsg.from,
        company: '',
        message: waMsg.text?.body || '',
        sourceMessageId: waMsg.id,
        timestamp: new Date(Number(waMsg.timestamp) * 1000).toISOString(),
        idempotencyKey: waMsg.id
      };

      const result = await messageProcessor.processInbound(payload);
      res.status(200).json({ success: true, result });
    } catch (error) {
      logger.error('Error processing WhatsApp webhook', error);
      res.status(500).json({ error: 'Internal WhatsApp webhook error' });
    }
  }

  /**
   * Post-Call Webhook
   * POST /api/webhooks/post-call
   * Captures the completed call duration, transcript, and Naga's spoken instruction.
   */
  public async handlePostCallWebhook(req: Request, res: Response): Promise<void> {
    const body: PostCallWebhookPayload = req.body;

    if (!body || (!body.callId && !body.providerCallId)) {
      res.status(400).json({ error: 'Missing callId or providerCallId.' });
      return;
    }

    try {
      const allCalls = await firestoreService.getCalls();
      const call = allCalls.find(
        c => c.id === body.callId || c.providerCallId === body.providerCallId
      );

      if (!call) {
        res.status(404).json({ error: 'Call record not found.' });
        return;
      }

      const updated = await firestoreService.updateCall(call.id, {
        status: body.status || 'completed',
        duration: body.duration || call.duration,
        transcript: body.transcript || call.transcript,
        ownerInstruction: body.ownerInstruction || call.ownerInstruction,
        endedAt: body.endedAt || new Date().toISOString()
      });

      // If owner gave a new instruction during the call, save/update action task
      if (body.ownerInstruction) {
        await firestoreService.saveTask({
          title: `Action: ${call.clientName} - "${body.ownerInstruction}"`,
          description: `Voice call instruction recorded by ${config.assistantName || 'Arya'} from Naga.\nOriginal Summary: ${call.summary}\nFull Instruction: ${body.ownerInstruction}`,
          clientId: call.clientId,
          clientName: call.clientName,
          callId: call.id,
          priority: call.priority,
          status: 'pending',
          dueDate: 'Tomorrow',
          source: 'owner_instruction',
          createdAt: new Date().toISOString()
        });

        firestoreService.recordAudit({
          service: 'post_call',
          event: 'instruction_saved',
          status: 'success',
          details: { callId: call.id, instruction: body.ownerInstruction }
        });
      }

      res.status(200).json({ success: true, call: updated });
    } catch (error) {
      logger.error('Error handling post-call webhook', error);
      res.status(500).json({ error: 'Internal post-call processing error' });
    }
  }
}

export const webhookController = new WebhookController();
