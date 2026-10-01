import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { cleanInboundMessage } from '../utils/cleaner';
import { evaluateDeterministicPreFilter } from '../utils/preFilter';
import { geminiService } from './geminiService';
import { firestoreService } from './db/firestoreService';
import { getVoiceProvider } from './voice/voiceProvider';
import { getTelephonyProvider } from './telephony/telephonyProvider';
import {
  InboundMessagePayload,
  Message,
  AIAnalysis,
  Call,
  Task
} from '../types/shared';

// In-memory idempotency cache to prevent duplicate processing of webhook retries
const processedMessageCache = new Set<string>();

export interface ProcessingResult {
  message: Message;
  analysis: AIAnalysis;
  call?: Call;
  task?: Task;
  callTriggered: boolean;
  quietHoursBlocked?: boolean;
}

export class MessageProcessor {
  /**
   * Evaluates if the current time falls within configured quiet hours.
   */
  private isQuietHour(now: Date = new Date()): boolean {
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentMinutesTotal = currentHours * 60 + currentMinutes;

    const [startH, startM] = config.quietHoursStart.split(':').map(Number);
    const [endH, endM] = config.quietHoursEnd.split(':').map(Number);

    const startMinutesTotal = startH * 60 + startM;
    const endMinutesTotal = endH * 60 + endM;

    // Overnight window (e.g. 22:00 to 07:00)
    if (startMinutesTotal > endMinutesTotal) {
      return currentMinutesTotal >= startMinutesTotal || currentMinutesTotal < endMinutesTotal;
    }
    // Daytime window
    return currentMinutesTotal >= startMinutesTotal && currentMinutesTotal < endMinutesTotal;
  }

  public async processInbound(payload: InboundMessagePayload): Promise<ProcessingResult> {
    const idempotencyKey =
      payload.idempotencyKey ||
      payload.sourceMessageId ||
      `${payload.clientContact}-${payload.message.slice(0, 40)}`;

    if (processedMessageCache.has(idempotencyKey)) {
      logger.warn('Duplicate message detected via idempotency check. Skipping reprocessing.', {
        idempotencyKey
      });
      const existing = (await firestoreService.getMessages()).find(
        m => m.sourceMessageId === payload.sourceMessageId
      );
      if (existing) {
        const analysis = await firestoreService.getAnalysisForMessage(existing.id);
        if (analysis) {
          return {
            message: existing,
            analysis,
            callTriggered: false
          };
        }
      }
    }
    processedMessageCache.add(idempotencyKey);

    logger.info('Processing inbound client message', {
      channel: payload.channel,
      clientName: payload.clientName,
      subject: payload.subject
    });

    // 1. Upsert Client Profile
    const client = await firestoreService.upsertClient({
      name: payload.clientName || 'Valued Client',
      company: payload.company || 'Client Business',
      phone: payload.channel === 'whatsapp' ? payload.clientContact : undefined,
      email: payload.channel === 'email' ? payload.clientContact : undefined,
      whatsapp: payload.channel === 'whatsapp' ? payload.clientContact : undefined
    });

    // 2. Clean Message (Strip quotes, signatures, legal disclaimers)
    const cleanedText = cleanInboundMessage(payload.channel, payload.message);

    // 3. Save Message Record to Firestore
    const messageRecord = await firestoreService.saveMessage({
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      channel: payload.channel,
      subject: payload.subject,
      message: payload.message,
      cleanMessage: cleanedText,
      receivedAt: payload.timestamp || new Date().toISOString(),
      status: 'received',
      sourceMessageId: payload.sourceMessageId,
      rawPayload: { ...payload }
    });

    firestoreService.recordAudit({
      service: 'message_processor',
      event: 'message_received',
      status: 'success',
      details: { messageId: messageRecord.id, client: client.name, channel: payload.channel }
    });

    // 4. Deterministic Pre-Filtering (Cost Control & Speed)
    const preFilter = evaluateDeterministicPreFilter(cleanedText, payload.subject || '');
    let analysisResult: AIAnalysis;

    if (preFilter.isFiltered) {
      logger.info('Message resolved via deterministic pre-filter. Skipping LLM call.', {
        category: preFilter.category,
        messageId: messageRecord.id
      });

      analysisResult = await firestoreService.saveAIAnalysis({
        messageId: messageRecord.id,
        should_call: false,
        client_name: client.name,
        company: client.company,
        client_contact: payload.clientContact,
        channel: payload.channel,
        priority: preFilter.priority || 'low',
        summary: preFilter.summary || 'தகவல் பதிவு செய்யப்பட்டது.',
        next_step: preFilter.next_step || 'No immediate action.',
        deadline: '',
        reason: preFilter.reason || 'Filtered by deterministic rules.',
        category: preFilter.category || 'general',
        model: 'deterministic-prefilter',
        createdAt: new Date().toISOString()
      });

      await firestoreService.updateMessageStatus(messageRecord.id, 'ignored');

      return {
        message: messageRecord,
        analysis: analysisResult,
        callTriggered: false
      };
    }

    // 5. Gemini AI Analysis (Deep reasoning, Chennai Tamil summary, call decision)
    const geminiOutput = await geminiService.analyzeMessage({
      channel: payload.channel,
      clientName: client.name,
      clientContact: payload.clientContact,
      company: client.company,
      subject: payload.subject,
      message: cleanedText
    });

    analysisResult = await firestoreService.saveAIAnalysis({
      messageId: messageRecord.id,
      should_call: geminiOutput.should_call,
      client_name: geminiOutput.client_name || client.name,
      company: geminiOutput.company || client.company,
      client_contact: geminiOutput.client_contact || payload.clientContact,
      channel: geminiOutput.channel,
      priority: geminiOutput.priority,
      summary: geminiOutput.summary,
      next_step: geminiOutput.next_step,
      deadline: geminiOutput.deadline,
      reason: geminiOutput.reason,
      category: geminiOutput.category,
      model: config.geminiModel,
      createdAt: new Date().toISOString()
    });

    firestoreService.recordAudit({
      service: 'gemini',
      event: 'message_analyzed',
      status: 'success',
      details: {
        messageId: messageRecord.id,
        should_call: analysisResult.should_call,
        priority: analysisResult.priority,
        category: analysisResult.category
      }
    });

    // 6. Check Quiet Hours
    let shouldCall = analysisResult.should_call;
    let quietBlocked = false;

    if (shouldCall && this.isQuietHour()) {
      if (analysisResult.priority === 'high' && config.allowHighPriorityInQuietHours) {
        logger.info('High-priority call allowed through quiet hours', {
          clientName: client.name
        });
      } else {
        logger.info('Voice call deferred due to active quiet hours', {
          quietStart: config.quietHoursStart,
          quietEnd: config.quietHoursEnd
        });
        shouldCall = false;
        quietBlocked = true;
      }
    }

    let callRecord: Call | undefined;
    let taskRecord: Task | undefined;

    // 7. Dispatch Voice Call if should_call is true
    if (shouldCall) {
      await firestoreService.updateMessageStatus(messageRecord.id, 'called');

      const callId = `call-${uuidv4()}`;
      const voiceProvider = getVoiceProvider();

      logger.info(`Dispatching call via provider: ${voiceProvider.name}`, {
        callId,
        ownerPhone: config.ownerPhone
      });

      const callResult = await voiceProvider.createCall({
        callId,
        ownerName: config.ownerName,
        clientName: analysisResult.client_name,
        channel: payload.channel,
        summary: analysisResult.summary,
        nextStep: analysisResult.next_step,
        priority: analysisResult.priority,
        recipientPhone: config.ownerPhone,
        deadline: analysisResult.deadline
      });

      callRecord = await firestoreService.saveCall({
        id: callId,
        messageId: messageRecord.id,
        clientId: client.id,
        clientName: analysisResult.client_name,
        channel: payload.channel,
        phoneNumber: config.ownerPhone,
        provider: voiceProvider.name.includes('SnapServe') ? 'snapserve' : 'mock',
        providerCallId: callResult.providerCallId,
        status: callResult.status,
        priority: analysisResult.priority,
        reason: analysisResult.reason,
        summary: analysisResult.summary,
        nextStep: analysisResult.next_step,
        transcript: callResult.simulatedTranscript,
        ownerInstruction: callResult.simulatedOwnerInstruction,
        duration: callResult.status === 'completed' ? 38 : 0,
        startedAt: callResult.startedAt,
        endedAt: callResult.status === 'completed' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString()
      });

      firestoreService.recordAudit({
        service: 'voice',
        event: 'call_completed',
        status: 'success',
        details: { callId: callRecord.id, providerCallId: callResult.providerCallId }
      });

      // 8. Auto-create Task if owner instruction or actionable next step detected
      const instructionText = callRecord.ownerInstruction || analysisResult.next_step;
      taskRecord = await firestoreService.saveTask({
        title: `${analysisResult.category.toUpperCase()}: ${analysisResult.client_name} - ${analysisResult.next_step}`,
        description: `Client: ${client.name} (${client.company})\nSummary: ${analysisResult.summary}\nInstruction: ${instructionText}`,
        clientId: client.id,
        clientName: client.name,
        company: client.company,
        messageId: messageRecord.id,
        callId: callRecord.id,
        priority: analysisResult.priority,
        status: 'pending',
        dueDate: analysisResult.deadline || 'Tomorrow',
        source: callRecord.ownerInstruction ? 'owner_instruction' : 'ai_analysis',
        createdAt: new Date().toISOString()
      });

      await firestoreService.addNotification({
        title: `Call Placed for ${client.name}`,
        message: `${config.assistantName || 'Arya'} called Naga: "${analysisResult.next_step}"`,
        type: 'call_completed',
        isRead: false,
        link: '/calls',
        createdAt: new Date().toISOString()
      });
    } else {
      await firestoreService.updateMessageStatus(messageRecord.id, 'analyzed');

      if (analysisResult.priority === 'high') {
        taskRecord = await firestoreService.saveTask({
          title: `Follow up with ${analysisResult.client_name}`,
          description: analysisResult.next_step,
          clientId: client.id,
          clientName: client.name,
          company: client.company,
          messageId: messageRecord.id,
          priority: 'high',
          status: 'pending',
          dueDate: analysisResult.deadline || 'Within 24 hours',
          source: 'ai_analysis',
          createdAt: new Date().toISOString()
        });

        await firestoreService.addNotification({
          title: `High Priority Message: ${client.name}`,
          message: analysisResult.next_step,
          type: 'high_priority',
          isRead: false,
          link: '/messages',
          createdAt: new Date().toISOString()
        });
      }
    }

    return {
      message: messageRecord,
      analysis: analysisResult,
      call: callRecord,
      task: taskRecord,
      callTriggered: shouldCall,
      quietHoursBlocked: quietBlocked
    };
  }
}

export const messageProcessor = new MessageProcessor();
