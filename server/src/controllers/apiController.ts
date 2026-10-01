import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from '../services/db/firestoreService';
import { geminiService } from '../services/geminiService';
import { getVoiceProvider } from '../services/voice/voiceProvider';
import { config } from '../config/index';
import { logger } from '../utils/logger';

export class ApiController {
  // --- Dashboard Stats ---
  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await firestoreService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching dashboard stats', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  // --- Messages ---
  public async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { channel, priority, status, clientId, importantOnly } = req.query;
      const messages = await firestoreService.getMessages({
        channel: channel as string,
        priority: priority as string,
        status: status as string,
        clientId: clientId as string,
        importantOnly: importantOnly === 'true'
      });

      // Enhance with AI analysis
      const enhanced = await Promise.all(
        messages.map(async m => {
          const analysis = await firestoreService.getAnalysisForMessage(m.id);
          return {
            ...m,
            analysis
          };
        })
      );

      res.json(enhanced);
    } catch (error) {
      logger.error('Error fetching messages', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  public async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      const message = await firestoreService.getMessageById(req.params.id as string);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      const analysis = await firestoreService.getAnalysisForMessage(message.id);
      res.json({ ...message, analysis });
    } catch (error) {
      logger.error('Error fetching message by id', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  }

  public async analyzeMessageManually(req: Request, res: Response): Promise<void> {
    try {
      const { message, channel, clientName, clientContact, company, subject } = req.body;
      if (!message) {
        res.status(400).json({ error: 'Message body is required.' });
        return;
      }

      const result = await geminiService.analyzeMessage({
        message,
        channel: channel || 'email',
        clientName,
        clientContact,
        company,
        subject
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in manual message analysis', error);
      res.status(500).json({ error: 'Failed to analyze message' });
    }
  }

  // --- Clients ---
  public async getClients(req: Request, res: Response): Promise<void> {
    try {
      const clients = await firestoreService.getClients();
      res.json(clients);
    } catch (error) {
      logger.error('Error fetching clients', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  public async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const client = await firestoreService.getClientById(req.params.id as string);
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }
      const messages = await firestoreService.getMessages({ clientId: client.id });
      const calls = (await firestoreService.getCalls()).filter(c => c.clientId === client.id);
      const tasks = (await firestoreService.getTasks()).filter(t => t.clientId === client.id);

      res.json({
        ...client,
        messages,
        calls,
        tasks
      });
    } catch (error) {
      logger.error('Error fetching client details', error);
      res.status(500).json({ error: 'Failed to fetch client details' });
    }
  }

  // --- Calls ---
  public async getCalls(req: Request, res: Response): Promise<void> {
    try {
      const calls = await firestoreService.getCalls();
      res.json(calls);
    } catch (error) {
      logger.error('Error fetching calls', error);
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  }

  public async getCallById(req: Request, res: Response): Promise<void> {
    try {
      const call = await firestoreService.getCallById(req.params.id as string);
      if (!call) {
        res.status(404).json({ error: 'Call not found' });
        return;
      }
      res.json(call);
    } catch (error) {
      logger.error('Error fetching call by id', error);
      res.status(500).json({ error: 'Failed to fetch call' });
    }
  }

  public async triggerManualCall(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, clientId, customSummary } = req.body;
      let summary = customSummary;
      let clientName = 'Client';
      let channel = 'whatsapp';
      let nextStep = 'Action required';
      let priority = 'high';

      if (messageId) {
        const message = await firestoreService.getMessageById(messageId);
        const analysis = await firestoreService.getAnalysisForMessage(messageId);
        if (message) {
          clientName = message.clientName || clientName;
          channel = message.channel;
        }
        if (analysis) {
          summary = summary || analysis.summary;
          nextStep = analysis.next_step;
          priority = analysis.priority;
        }
      }

      if (!summary) {
        summary = `வணக்கம் Naga, ${clientName} கிட்ட இருந்து ஒரு முக்கியமான தகவல் வந்திருக்கு.`;
      }

      const voiceProvider = getVoiceProvider();
      const callId = `call-manual-${uuidv4()}`;

      const callResult = await voiceProvider.createCall({
        callId,
        ownerName: config.ownerName,
        clientName,
        channel: channel as any,
        summary,
        nextStep,
        priority: priority as any,
        recipientPhone: config.ownerPhone
      });

      const callRecord = await firestoreService.saveCall({
        id: callId,
        messageId,
        clientId,
        clientName,
        channel: channel as any,
        phoneNumber: config.ownerPhone,
        provider: voiceProvider.name.includes('SnapServe') ? 'snapserve' : 'mock',
        providerCallId: callResult.providerCallId,
        status: callResult.status,
        priority: priority as any,
        reason: 'Manual call triggered from dashboard',
        summary,
        nextStep,
        transcript: callResult.simulatedTranscript,
        ownerInstruction: callResult.simulatedOwnerInstruction,
        duration: 35,
        startedAt: callResult.startedAt,
        endedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      res.status(200).json({ success: true, call: callRecord });
    } catch (error) {
      logger.error('Error triggering manual call', error);
      res.status(500).json({ error: 'Failed to trigger call' });
    }
  }

  // --- Tasks ---
  public async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const tasks = await firestoreService.getTasks(status as string);
      res.json(tasks);
    } catch (error) {
      logger.error('Error fetching tasks', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, clientId, clientName, priority, dueDate } = req.body;
      if (!title) {
        res.status(400).json({ error: 'Task title is required.' });
        return;
      }
      const task = await firestoreService.saveTask({
        title,
        description: description || '',
        clientId,
        clientName,
        priority: priority || 'normal',
        status: 'pending',
        dueDate,
        source: 'manual',
        createdAt: new Date().toISOString()
      });
      res.status(201).json(task);
    } catch (error) {
      logger.error('Error creating task', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  public async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const updated = await firestoreService.updateTask(req.params.id as string, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      logger.error('Error updating task', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }

  // --- Integrations & Settings ---
  public async getIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const integrations = await firestoreService.getIntegrations();
      res.json(integrations);
    } catch (error) {
      logger.error('Error fetching integrations', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  public async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await firestoreService.getSettings();
      res.json(settings);
    } catch (error) {
      logger.error('Error fetching settings', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  public async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const updated = await firestoreService.updateSettings(req.body);
      res.json(updated);
    } catch (error) {
      logger.error('Error updating settings', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  // --- Notifications ---
  public async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifs = await firestoreService.getNotifications();
      res.json(notifs);
    } catch (error) {
      logger.error('Error fetching notifications', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  public async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      await firestoreService.markNotificationRead(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating notification', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  // --- Audit Logs ---
  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await firestoreService.getAuditLogs();
      res.json(logs);
    } catch (error) {
      logger.error('Error fetching audit logs', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  // --- Health Check ---
  public getHealth(req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      service: `Naga AI Assistant (${config.assistantName || 'Arya'})`,
      mockMode: config.mockMode,
      liveFirebase: firestoreService.isLiveConnected(),
      time: new Date().toISOString()
    });
  }
}

export const apiController = new ApiController();
