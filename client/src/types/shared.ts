// ============================================================================
// Naga AI Assistant (Saranya) — Client Shared TypeScript Definitions
// ============================================================================

export type MessageChannel = 'email' | 'whatsapp';
export type MessagePriority = 'high' | 'normal' | 'low';

export type MessageCategory =
  | 'payment'
  | 'quotation'
  | 'meeting'
  | 'project'
  | 'deadline'
  | 'complaint'
  | 'question'
  | 'confirmation'
  | 'delivery'
  | 'technical'
  | 'general'
  | 'spam'
  | 'otp'
  | 'promotion'
  | 'newsletter'
  | 'other';

export type MessageStatus = 'received' | 'analyzed' | 'called' | 'pending' | 'ignored';

export type CallStatus =
  | 'pending'
  | 'calling'
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'failed'
  | 'completed';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'viewer';
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  lastMessageAt: string;
  lastInteraction?: string;
  totalMessages: number;
  totalCalls: number;
  openTasks?: number;
  priority?: MessagePriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  id: string;
  messageId: string;
  should_call: boolean;
  client_name: string;
  company: string;
  client_contact: string;
  channel: MessageChannel;
  priority: MessagePriority;
  summary: string;     // 2-3 short spoken Chennai Tamil sentences
  next_step: string;
  deadline?: string;
  reason: string;
  category: MessageCategory;
  model: string;
  rawResponse?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  clientId: string;
  clientName?: string;
  company?: string;
  channel: MessageChannel;
  subject?: string;
  message: string;
  cleanMessage?: string;
  receivedAt: string;
  processedAt?: string;
  status: MessageStatus;
  sourceMessageId?: string;
  analysis?: AIAnalysis | null;
  rawPayload?: Record<string, unknown>;
}

export interface Call {
  id: string;
  messageId?: string;
  clientId?: string;
  clientName: string;
  channel: MessageChannel;
  phoneNumber: string;
  provider: 'mock' | 'snapserve' | 'vobiz';
  providerCallId: string;
  status: CallStatus;
  priority: MessagePriority;
  reason: string;
  summary: string;         // Spoken Tamil summary
  nextStep: string;
  transcript?: string;     // Full dialogue script in Tamil
  ownerInstruction?: string; // What Naga said / instructed
  duration: number;        // in seconds
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId?: string;
  clientName?: string;
  company?: string;
  messageId?: string;
  callId?: string;
  priority: MessagePriority;
  status: TaskStatus;
  dueDate?: string;
  source: 'ai_analysis' | 'owner_instruction' | 'manual';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'important_message' | 'high_priority' | 'call_completed' | 'call_failed' | 'task_due' | 'integration_error';
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  key: 'gemini' | 'firebase' | 'n8n' | 'gmail' | 'whatsapp' | 'snapserve' | 'vobiz';
  status: 'connected' | 'not_connected' | 'mock_mode';
  details: string;
  lastCheckedAt: string;
  icon?: string;
}

export interface Settings {
  id: string;
  assistantName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  language: string;
  voiceStyle: string;
  businessVocabulary: string[];
  callThreshold: 'high_only' | 'high_and_normal' | 'all';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    allowHighPriority: boolean;
  };
  emailFilters: {
    processOnlyLabel: string;
    ignoreSpamAndMarketing: boolean;
  };
  mockMode: boolean;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  requestId?: string;
  service: string;
  event:
    | 'login'
    | 'message_received'
    | 'message_cleaned'
    | 'message_analyzed'
    | 'call_requested'
    | 'call_started'
    | 'call_completed'
    | 'call_failed'
    | 'instruction_saved'
    | 'task_created'
    | 'task_updated'
    | 'integration_error'
    | 'settings_changed';
  status: 'success' | 'failure' | 'warning' | 'info';
  details: Record<string, unknown>;
}

export interface DashboardStats {
  messagesToday: number;
  importantMessages: number;
  callsMade: number;
  pendingActions: number;
  highPriority: number;
  activeClients: number;
  callAnswerRate: number;
  avgCallDurationSeconds: number;
  systemStatus: {
    saranyaStatus: 'ONLINE' | 'STANDBY' | 'OFFLINE';
    aryaStatus?: 'ONLINE' | 'STANDBY' | 'OFFLINE';
    assistantStatus?: 'ONLINE' | 'STANDBY' | 'OFFLINE';
    monitoring: {
      gmail: boolean;
      whatsapp: boolean;
    };
    voice: 'Ready' | 'Not Configured' | 'Mock Mode';
    mockMode: boolean;
  };
}

export interface InboundMessagePayload {
  channel: MessageChannel;
  clientName: string;
  clientContact: string;
  company?: string;
  subject?: string;
  message: string;
  sourceMessageId?: string;
  timestamp?: string;
  idempotencyKey?: string;
}
