import axios from 'axios';
import {
  Message,
  Client,
  Call,
  Task,
  DashboardNotification,
  IntegrationStatus,
  Settings,
  AuditLog,
  DashboardStats,
  InboundMessagePayload
} from '../types/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  // Messages
  async getMessages(params?: {
    channel?: string;
    priority?: string;
    status?: string;
    clientId?: string;
    importantOnly?: boolean;
  }): Promise<Message[]> {
    const { data } = await apiClient.get<Message[]>('/messages', { params });
    return data;
  },

  async getMessageById(id: string): Promise<Message> {
    const { data } = await apiClient.get<Message>(`/messages/${id}`);
    return data;
  },

  // Simulate Inbound Message
  async simulateInboundMessage(payload: InboundMessagePayload): Promise<any> {
    const { data } = await apiClient.post('/webhooks/n8n/message', payload, {
      headers: {
        'x-n8n-secret': 'dev_n8n_secret_token_12345'
      }
    });
    return data;
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data } = await apiClient.get<Client[]>('/clients');
    return data;
  },

  async getClientById(id: string): Promise<Client & { messages: Message[]; calls: Call[]; tasks: Task[] }> {
    const { data } = await apiClient.get(`/clients/${id}`);
    return data;
  },

  // Calls
  async getCalls(): Promise<Call[]> {
    const { data } = await apiClient.get<Call[]>('/calls');
    return data;
  },

  async getCallById(id: string): Promise<Call> {
    const { data } = await apiClient.get<Call>(`/calls/${id}`);
    return data;
  },

  async triggerManualCall(params: { messageId?: string; clientId?: string; customSummary?: string }): Promise<{ success: boolean; call: Call }> {
    const { data } = await apiClient.post('/calls', params);
    return data;
  },

  // Tasks
  async getTasks(status?: string): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>('/tasks', { params: { status } });
    return data;
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.post<Task>('/tasks', task);
    return data;
  },

  async updateTask(id: string, update: Partial<Task>): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, update);
    return data;
  },

  // Integrations & Settings
  async getIntegrations(): Promise<IntegrationStatus[]> {
    const { data } = await apiClient.get<IntegrationStatus[]>('/integrations');
    return data;
  },

  async getSettings(): Promise<Settings> {
    const { data } = await apiClient.get<Settings>('/settings');
    return data;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const { data } = await apiClient.post<Settings>('/settings', settings);
    return data;
  },

  // Notifications
  async getNotifications(): Promise<DashboardNotification[]> {
    const { data } = await apiClient.get<DashboardNotification[]>('/notifications');
    return data;
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await apiClient.get<AuditLog[]>('/audit-logs');
    return data;
  }
};
