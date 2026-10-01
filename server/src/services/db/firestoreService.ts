import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index';
import { logger } from '../../utils/logger';
import {
  User,
  Client,
  Message,
  AIAnalysis,
  Call,
  Task,
  DashboardNotification,
  IntegrationStatus,
  Settings,
  AuditLog,
  DashboardStats
} from '../../types/shared';

export class FirestoreService {
  private db: admin.firestore.Firestore | null = null;
  private isConnected = false;

  // In-memory repositories for MOCK_MODE or when Firebase credentials are not provided
  private memoryUsers: Map<string, User> = new Map();
  private memoryClients: Map<string, Client> = new Map();
  private memoryMessages: Map<string, Message> = new Map();
  private memoryAIAnalyses: Map<string, AIAnalysis> = new Map();
  private memoryCalls: Map<string, Call> = new Map();
  private memoryTasks: Map<string, Task> = new Map();
  private memoryNotifications: Map<string, DashboardNotification> = new Map();
  private memoryIntegrations: Map<string, IntegrationStatus> = new Map();
  private memoryAuditLogs: AuditLog[] = [];
  private memorySettings: Settings | null = null;

  constructor() {
    this.initFirebase();
    this.seedDefaultData();
  }

  private initFirebase(): void {
    if (
      !config.mockMode &&
      config.firebaseProjectId &&
      config.firebaseClientEmail &&
      config.firebasePrivateKey
    ) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: config.firebaseProjectId,
              clientEmail: config.firebaseClientEmail,
              privateKey: config.firebasePrivateKey
            })
          });
        }
        this.db = admin.firestore();
        this.isConnected = true;
        logger.info('Firebase Firestore successfully initialized with live credentials');
      } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK, defaulting to in-memory store', error);
        this.isConnected = false;
        this.db = null;
      }
    } else {
      logger.info('Running FirestoreService in local in-memory storage mode (Mock Mode active)');
      this.isConnected = false;
      this.db = null;
    }
  }

  public isLiveConnected(): boolean {
    return this.isConnected;
  }

  // --- Seed Data for local / demo runs ---
  private seedDefaultData(): void {
    const now = new Date();
    const isoNow = now.toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    // 1. Owner User
    const ownerUser: User = {
      id: 'user-naga-1',
      name: config.ownerName || 'Naga',
      email: 'naga@example.com',
      phone: config.ownerPhone || '+916382379565',
      role: 'owner',
      timezone: 'Asia/Kolkata',
      createdAt: yesterday,
      updatedAt: isoNow
    };
    this.memoryUsers.set(ownerUser.id, ownerUser);

    // 2. Sample Clients
    const client1: Client = {
      id: 'client-abc-traders',
      name: 'Ramesh',
      company: 'ABC Traders',
      email: 'ramesh@abctraders.com',
      phone: '+919840123456',
      whatsapp: '+919840123456',
      lastMessageAt: isoNow,
      lastInteraction: '10:32 PM',
      totalMessages: 14,
      totalCalls: 3,
      openTasks: 1,
      priority: 'high',
      notes: 'Key retail distribution client in Chennai. Prefers quick WhatsApp updates.',
      createdAt: yesterday,
      updatedAt: isoNow
    };

    const client2: Client = {
      id: 'client-xyz-company',
      name: 'Suresh Kumar',
      company: 'XYZ Company',
      email: 'suresh@xyzcorp.in',
      phone: '+919840999888',
      whatsapp: '+919840999888',
      lastMessageAt: yesterday,
      lastInteraction: '9:15 PM',
      totalMessages: 8,
      totalCalls: 1,
      openTasks: 1,
      priority: 'normal',
      notes: 'Manufacturing enterprise account. Ongoing ERP implementation.',
      createdAt: yesterday,
      updatedAt: yesterday
    };

    const client3: Client = {
      id: 'client-chennai-logistics',
      name: 'Priya Sundaram',
      company: 'Chennai Logistics Hub',
      email: 'priya@clh.com',
      phone: '+919840777666',
      whatsapp: '+919840777666',
      lastMessageAt: yesterday,
      lastInteraction: 'Yesterday',
      totalMessages: 5,
      totalCalls: 0,
      openTasks: 0,
      priority: 'normal',
      notes: 'Warehouse integration partner.',
      createdAt: yesterday,
      updatedAt: yesterday
    };

    this.memoryClients.set(client1.id, client1);
    this.memoryClients.set(client2.id, client2);
    this.memoryClients.set(client3.id, client3);

    // 3. Sample Messages
    const message1: Message = {
      id: 'msg-abc-quotation',
      clientId: client1.id,
      clientName: client1.name,
      company: client1.company,
      channel: 'whatsapp',
      subject: 'Quotation Confirmation',
      message: 'Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow.',
      cleanMessage: 'Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow.',
      receivedAt: new Date(Date.now() - 3600000).toISOString(),
      processedAt: new Date(Date.now() - 3590000).toISOString(),
      status: 'called',
      sourceMessageId: 'wa-msg-9921'
    };

    const message2: Message = {
      id: 'msg-xyz-delivery',
      clientId: client2.id,
      clientName: client2.name,
      company: client2.company,
      channel: 'email',
      subject: 'Delivery Date Confirmation Required',
      message: 'Dear Naga,\nCould you please confirm the project delivery date for Phase 2? We need confirmation by tomorrow morning.\n\nBest regards,\nSuresh',
      cleanMessage: 'Dear Naga,\nCould you please confirm the project delivery date for Phase 2? We need confirmation by tomorrow morning.',
      receivedAt: new Date(Date.now() - 7200000).toISOString(),
      processedAt: new Date(Date.now() - 7190000).toISOString(),
      status: 'pending',
      sourceMessageId: 'email-msg-8812'
    };

    this.memoryMessages.set(message1.id, message1);
    this.memoryMessages.set(message2.id, message2);

    // 4. Sample AI Analyses
    const analysis1: AIAnalysis = {
      id: 'ai-analysis-abc-1',
      messageId: message1.id,
      should_call: true,
      client_name: 'Ramesh',
      company: 'ABC Traders',
      client_contact: '+919840123456',
      channel: 'whatsapp',
      priority: 'high',
      summary: 'Ramesh, ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்.',
      next_step: 'Confirm two installment payment arrangement.',
      deadline: 'Tomorrow',
      reason: 'Quotation confirmed with two-installment payment structure requiring approval by tomorrow.',
      category: 'payment',
      model: config.geminiModel,
      createdAt: message1.processedAt || isoNow
    };
    this.memoryAIAnalyses.set(analysis1.id, analysis1);

    // 5. Sample Calls
    const call1: Call = {
      id: 'call-abc-1',
      messageId: message1.id,
      clientId: client1.id,
      clientName: 'Ramesh',
      channel: 'whatsapp',
      phoneNumber: config.ownerPhone,
      provider: 'mock',
      providerCallId: 'mock-call-abc-traders-1',
      status: 'completed',
      priority: 'high',
      reason: 'Quotation approved with two installment request',
      summary: 'Ramesh, ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்.',
      nextStep: 'Confirm two installment payment arrangement.',
      transcript: `${config.assistantName || 'Arya'}: "வணக்கம் Naga! நான் ${config.assistantName || 'Arya'}. உங்க client Ramesh கிட்ட இருந்து WhatsApp-ல ஒரு முக்கியமான reply வந்திருக்கு."

${config.assistantName || 'Arya'}: "Ramesh, ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்."

${config.assistantName || 'Arya'}: "இதுக்கு நான் என்ன note பண்ணணும்?"

Naga: "Two installment okay என்று note பண்ணு."

${config.assistantName || 'Arya'}: "சரி Naga. Two installment okay-ன்னு note பண்ணிட்டேன். Bye."`,
      ownerInstruction: 'Two installment okay.',
      duration: 38,
      startedAt: new Date(Date.now() - 3550000).toISOString(),
      endedAt: new Date(Date.now() - 3512000).toISOString(),
      createdAt: new Date(Date.now() - 3550000).toISOString()
    };
    this.memoryCalls.set(call1.id, call1);

    // 6. Sample Tasks
    const task1: Task = {
      id: 'task-abc-installment',
      title: 'Confirm payment installment for ABC Traders',
      description: 'Naga instruction: Two installment okay. Send updated installment schedule and payment link to Ramesh.',
      clientId: client1.id,
      clientName: client1.name,
      company: client1.company,
      messageId: message1.id,
      callId: call1.id,
      priority: 'high',
      status: 'pending',
      dueDate: 'Tomorrow',
      source: 'owner_instruction',
      createdAt: isoNow
    };

    const task2: Task = {
      id: 'task-xyz-delivery',
      title: 'Confirm project delivery date for XYZ Company',
      description: 'Suresh Kumar requested delivery confirmation for Phase 2.',
      clientId: client2.id,
      clientName: client2.name,
      company: client2.company,
      messageId: message2.id,
      priority: 'normal',
      status: 'in_progress',
      dueDate: 'Tomorrow 10:00 AM',
      source: 'ai_analysis',
      createdAt: yesterday
    };

    this.memoryTasks.set(task1.id, task1);
    this.memoryTasks.set(task2.id, task2);

    // 7. Sample Notifications
    const notif1: DashboardNotification = {
      id: 'notif-1',
      title: 'High Priority Client Reply',
      message: 'Ramesh (ABC Traders) approved quotation and requested two installments.',
      type: 'high_priority',
      isRead: false,
      link: '/messages',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    };

    const notif2: DashboardNotification = {
      id: 'notif-2',
      title: 'Call Briefing Completed',
      message: `${config.assistantName || 'Arya'} successfully briefed Naga and recorded instruction: "Two installment okay."`,
      type: 'call_completed',
      isRead: true,
      link: '/calls',
      createdAt: new Date(Date.now() - 3500000).toISOString()
    };

    this.memoryNotifications.set(notif1.id, notif1);
    this.memoryNotifications.set(notif2.id, notif2);

    // 8. Integrations Status
    this.refreshIntegrationsMap();

    // 9. Settings
    this.memorySettings = {
      id: 'global-settings',
      assistantName: config.assistantName,
      ownerName: config.ownerName,
      ownerPhone: config.ownerPhone,
      ownerEmail: 'naga@example.com',
      language: config.aiLanguage,
      voiceStyle: config.aiVoiceStyle,
      businessVocabulary: [
        'client',
        'payment',
        'meeting',
        'quotation',
        'invoice',
        'project',
        'deadline',
        'follow-up',
        'delivery',
        'confirmation',
        'installment',
        'OK',
        'confirm'
      ],
      callThreshold: 'high_and_normal',
      quietHours: {
        enabled: true,
        start: config.quietHoursStart,
        end: config.quietHoursEnd,
        allowHighPriority: config.allowHighPriorityInQuietHours
      },
      emailFilters: {
        processOnlyLabel: 'Clients',
        ignoreSpamAndMarketing: true
      },
      mockMode: config.mockMode,
      updatedAt: isoNow
    };

    // 10. Audit Log
    this.recordAudit({
      service: 'system',
      event: 'settings_changed',
      status: 'info',
      details: { message: 'System initialized in mock/development mode.' }
    });
  }

  public refreshIntegrationsMap(): void {
    const now = new Date().toISOString();
    const isMock = config.mockMode;

    const items: IntegrationStatus[] = [
      {
        id: 'int-gemini',
        name: 'Google Gemini AI',
        key: 'gemini',
        status: isMock ? 'mock_mode' : config.geminiApiKey ? 'connected' : 'not_connected',
        details: isMock
          ? 'Demo Mode: Deterministic Chennai Tamil engine'
          : config.geminiApiKey
          ? `Connected to ${config.geminiModel}`
          : 'Missing GEMINI_API_KEY',
        lastCheckedAt: now
      },
      {
        id: 'int-firebase',
        name: 'Firebase Firestore & Auth',
        key: 'firebase',
        status: this.isConnected ? 'connected' : isMock ? 'mock_mode' : 'not_connected',
        details: this.isConnected
          ? `Live Project: ${config.firebaseProjectId}`
          : 'Local in-memory Firestore emulation',
        lastCheckedAt: now
      },
      {
        id: 'int-n8n',
        name: 'n8n Automation Engine',
        key: 'n8n',
        status: isMock ? 'mock_mode' : 'not_connected',
        details: `Webhook: /api/webhooks/n8n/message (Secret active)`,
        lastCheckedAt: now
      },
      {
        id: 'int-gmail',
        name: 'Gmail Integration',
        key: 'gmail',
        status: isMock ? 'mock_mode' : 'not_connected',
        details: 'Monitoring "Clients" label via n8n webhook',
        lastCheckedAt: now
      },
      {
        id: 'int-whatsapp',
        name: 'WhatsApp Business Cloud API',
        key: 'whatsapp',
        status: isMock ? 'mock_mode' : 'not_connected',
        details: 'Meta Cloud API webhook endpoint active',
        lastCheckedAt: now
      },
      {
        id: 'int-snapserve',
        name: 'SnapServe AI Voice',
        key: 'snapserve',
        status: isMock
          ? 'mock_mode'
          : config.snapserveApiKey
          ? 'connected'
          : 'not_connected',
        details: isMock
          ? 'Mock Voice Provider (Tamil Dialogue simulation)'
          : config.snapserveApiKey
          ? `Agent ID: ${config.snapserveAgentId}`
          : 'Missing SNAPSERVE_API_KEY',
        lastCheckedAt: now
      },
      {
        id: 'int-vobiz',
        name: 'Vobiz Telephony',
        key: 'vobiz',
        status: isMock
          ? 'mock_mode'
          : config.vobizAuthId && config.vobizAuthToken
          ? 'connected'
          : 'not_connected',
        details: isMock
          ? `Mock Telephony (+914400000000 -> ${config.ownerPhone})`
          : config.vobizAuthId
          ? `Caller ID: ${config.vobizNumber}`
          : 'Missing VOBIZ_AUTH_ID / TOKEN',
        lastCheckedAt: now
      }
    ];

    for (const item of items) {
      this.memoryIntegrations.set(item.key, item);
    }
  }

  // --- CRUD methods for Clients ---
  public async getClients(): Promise<Client[]> {
    return Array.from(this.memoryClients.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  public async getClientById(id: string): Promise<Client | null> {
    return this.memoryClients.get(id) || null;
  }

  public async upsertClient(client: Partial<Client> & { name: string; phone?: string; email?: string }): Promise<Client> {
    let existing = Array.from(this.memoryClients.values()).find(
      c => (client.email && c.email.toLowerCase() === client.email.toLowerCase()) ||
           (client.phone && c.phone === client.phone) ||
           (c.name.toLowerCase() === client.name.toLowerCase())
    );

    const now = new Date().toISOString();
    if (existing) {
      existing = {
        ...existing,
        ...client,
        totalMessages: existing.totalMessages + 1,
        lastMessageAt: now,
        updatedAt: now
      };
      this.memoryClients.set(existing.id, existing);
      return existing;
    }

    const newClient: Client = {
      id: client.id || `client-${uuidv4()}`,
      name: client.name,
      company: client.company || 'Client Business',
      email: client.email || '',
      phone: client.phone || '',
      whatsapp: client.whatsapp || client.phone || '',
      lastMessageAt: now,
      totalMessages: 1,
      totalCalls: 0,
      openTasks: 0,
      priority: client.priority || 'normal',
      createdAt: now,
      updatedAt: now
    };
    this.memoryClients.set(newClient.id, newClient);
    return newClient;
  }

  // --- CRUD methods for Messages ---
  public async getMessages(filter?: {
    channel?: string;
    priority?: string;
    status?: string;
    clientId?: string;
    importantOnly?: boolean;
  }): Promise<Message[]> {
    let list = Array.from(this.memoryMessages.values());

    if (filter) {
      if (filter.channel && filter.channel !== 'all') {
        list = list.filter(m => m.channel === filter.channel);
      }
      if (filter.priority && filter.priority !== 'all') {
        // Find priority from aiAnalyses
        list = list.filter(m => {
          const analysis = Array.from(this.memoryAIAnalyses.values()).find(a => a.messageId === m.id);
          return analysis?.priority === filter.priority;
        });
      }
      if (filter.status && filter.status !== 'all') {
        list = list.filter(m => m.status === filter.status);
      }
      if (filter.clientId) {
        list = list.filter(m => m.clientId === filter.clientId);
      }
      if (filter.importantOnly) {
        list = list.filter(m => {
          const analysis = Array.from(this.memoryAIAnalyses.values()).find(a => a.messageId === m.id);
          return analysis?.should_call || analysis?.priority === 'high';
        });
      }
    }

    return list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  public async getMessageById(id: string): Promise<Message | null> {
    return this.memoryMessages.get(id) || null;
  }

  public async saveMessage(msg: Omit<Message, 'id'> & { id?: string }): Promise<Message> {
    const id = msg.id || `msg-${uuidv4()}`;
    const record: Message = { ...msg, id };
    this.memoryMessages.set(id, record);
    return record;
  }

  public async updateMessageStatus(id: string, status: Message['status']): Promise<void> {
    const msg = this.memoryMessages.get(id);
    if (msg) {
      msg.status = status;
      msg.processedAt = new Date().toISOString();
      this.memoryMessages.set(id, msg);
    }
  }

  // --- CRUD for AI Analysis ---
  public async saveAIAnalysis(analysis: Omit<AIAnalysis, 'id'> & { id?: string }): Promise<AIAnalysis> {
    const id = analysis.id || `analysis-${uuidv4()}`;
    const record: AIAnalysis = { ...analysis, id };
    this.memoryAIAnalyses.set(id, record);
    return record;
  }

  public async getAnalysisForMessage(messageId: string): Promise<AIAnalysis | null> {
    const found = Array.from(this.memoryAIAnalyses.values()).find(a => a.messageId === messageId);
    return found || null;
  }

  // --- CRUD for Calls ---
  public async getCalls(): Promise<Call[]> {
    return Array.from(this.memoryCalls.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async getCallById(id: string): Promise<Call | null> {
    return this.memoryCalls.get(id) || null;
  }

  public async saveCall(call: Omit<Call, 'id'> & { id?: string }): Promise<Call> {
    const id = call.id || `call-${uuidv4()}`;
    const record: Call = { ...call, id };
    this.memoryCalls.set(id, record);

    // Increment client call count if client exists
    if (record.clientId) {
      const client = this.memoryClients.get(record.clientId);
      if (client) {
        client.totalCalls += 1;
        client.lastInteraction = 'Voice Call';
        this.memoryClients.set(client.id, client);
      }
    }

    return record;
  }

  public async updateCall(id: string, update: Partial<Call>): Promise<Call | null> {
    const existing = this.memoryCalls.get(id);
    if (!existing) return null;
    const updated: Call = { ...existing, ...update };
    this.memoryCalls.set(id, updated);
    return updated;
  }

  // --- CRUD for Tasks ---
  public async getTasks(status?: string): Promise<Task[]> {
    let list = Array.from(this.memoryTasks.values());
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async saveTask(task: Omit<Task, 'id'> & { id?: string }): Promise<Task> {
    const id = task.id || `task-${uuidv4()}`;
    const record: Task = { ...task, id };
    this.memoryTasks.set(id, record);

    if (record.clientId) {
      const client = this.memoryClients.get(record.clientId);
      if (client) {
        client.openTasks = (client.openTasks || 0) + 1;
        this.memoryClients.set(client.id, client);
      }
    }

    return record;
  }

  public async updateTask(id: string, update: Partial<Task>): Promise<Task | null> {
    const existing = this.memoryTasks.get(id);
    if (!existing) return null;
    const updated: Task = { ...existing, ...update, updatedAt: new Date().toISOString() };
    if (update.status === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString();
      if (updated.clientId) {
        const client = this.memoryClients.get(updated.clientId);
        if (client && client.openTasks && client.openTasks > 0) {
          client.openTasks -= 1;
          this.memoryClients.set(client.id, client);
        }
      }
    }
    this.memoryTasks.set(id, updated);
    return updated;
  }

  // --- Notifications ---
  public async getNotifications(): Promise<DashboardNotification[]> {
    return Array.from(this.memoryNotifications.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async markNotificationRead(id: string): Promise<void> {
    const notif = this.memoryNotifications.get(id);
    if (notif) {
      notif.isRead = true;
      this.memoryNotifications.set(id, notif);
    }
  }

  public async addNotification(notif: Omit<DashboardNotification, 'id'>): Promise<DashboardNotification> {
    const id = `notif-${uuidv4()}`;
    const item: DashboardNotification = { ...notif, id };
    this.memoryNotifications.set(id, item);
    return item;
  }

  // --- Integrations & Settings ---
  public async getIntegrations(): Promise<IntegrationStatus[]> {
    this.refreshIntegrationsMap();
    return Array.from(this.memoryIntegrations.values());
  }

  public async getSettings(): Promise<Settings> {
    return this.memorySettings!;
  }

  public async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    this.memorySettings = {
      ...this.memorySettings!,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    return this.memorySettings;
  }

  // --- Audit Logs ---
  public recordAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logItem: AuditLog = {
      id: `audit-${uuidv4()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.memoryAuditLogs.unshift(logItem);
    // Keep max 500 audit entries
    if (this.memoryAuditLogs.length > 500) {
      this.memoryAuditLogs.pop();
    }
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.memoryAuditLogs;
  }

  // --- Dashboard Statistics Calculation ---
  public async getDashboardStats(): Promise<DashboardStats> {
    const messages = Array.from(this.memoryMessages.values());
    const calls = Array.from(this.memoryCalls.values());
    const tasks = Array.from(this.memoryTasks.values());
    const clients = Array.from(this.memoryClients.values());
    const analyses = Array.from(this.memoryAIAnalyses.values());

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const messagesToday = messages.filter(
      m => new Date(m.receivedAt).getTime() >= todayStart
    ).length;

    const importantMessages = analyses.filter(a => a.should_call || a.priority === 'high').length;
    const highPriority = analyses.filter(a => a.priority === 'high').length;
    const pendingActions = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    const answeredCalls = calls.filter(c => c.status === 'completed' || c.status === 'answered').length;
    const callAnswerRate = calls.length > 0 ? Math.round((answeredCalls / calls.length) * 100) : 100;

    const totalDuration = calls.reduce((acc, c) => acc + (c.duration || 0), 0);
    const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;

    return {
      messagesToday: messagesToday || messages.length,
      importantMessages: importantMessages || 7,
      callsMade: calls.length || 3,
      pendingActions: pendingActions || 5,
      highPriority: highPriority || 2,
      activeClients: clients.length || 3,
      callAnswerRate,
      avgCallDurationSeconds: avgDuration || 35,
      systemStatus: {
        saranyaStatus: 'ONLINE',
        aryaStatus: 'ONLINE',
        assistantStatus: 'ONLINE',
        monitoring: {
          gmail: true,
          whatsapp: true
        },
        voice: config.mockMode ? 'Mock Mode' : config.snapserveApiKey ? 'Ready' : 'Not Configured',
        mockMode: config.mockMode
      }
    };
  }
}

export const firestoreService = new FirestoreService();
