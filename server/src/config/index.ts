import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export interface AppConfig {
  env: string;
  isDev: boolean;
  mockMode: boolean;
  port: number;
  host: string;
  corsOrigin: string;

  // Security
  n8nWebhookSecret: string;
  whatsappWebhookVerifyToken: string;

  // Owner & Persona
  ownerName: string;
  ownerPhone: string;
  assistantName: string;
  aiLanguage: string;
  aiVoiceStyle: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  allowHighPriorityInQuietHours: boolean;

  // Gemini AI
  geminiApiKey: string;
  geminiModel: string;

  // Firebase
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;

  // n8n
  n8nWebhookUrl: string;
  n8nApiUrl: string;

  // SnapServe Voice
  snapserveBaseUrl: string;
  snapserveApiKey?: string;
  snapserveAgentId?: string;

  // Vobiz Telephony
  vobizBaseUrl: string;
  vobizAuthId?: string;
  vobizAuthToken?: string;
  vobizNumber?: string;
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'production',
  isDev: process.env.NODE_ENV === 'development',
  mockMode: process.env.MOCK_MODE === 'true', // Defaults to false in production
  port: parseInt(process.env.PORT || '5001', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || 'https://ai.tenkasidreams.com',

  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'dev_n8n_secret_token_12345',
  whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'dev_whatsapp_verify_token_12345',

  ownerName: process.env.OWNER_NAME || 'Naga',
  ownerPhone: process.env.OWNER_PHONE || '+916382379565',
  assistantName: process.env.AI_ASSISTANT_NAME || 'Arya',
  aiLanguage: process.env.AI_LANGUAGE || 'Tamil',
  aiVoiceStyle: process.env.AI_VOICE_STYLE || 'Natural Chennai conversational Tamil',
  quietHoursStart: process.env.QUIET_HOURS_START || '22:00',
  quietHoursEnd: process.env.QUIET_HOURS_END || '07:00',
  allowHighPriorityInQuietHours: process.env.ALLOW_HIGH_PRIORITY_IN_QUIET_HOURS !== 'false',

  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',

  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),

  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'https://ai.tenkasidreams.com/webhook/client-message',
  n8nApiUrl: process.env.N8N_API_URL || 'https://ai.tenkasidreams.com/api/v1',

  snapserveBaseUrl: process.env.SNAPSERVE_BASE_URL || 'https://api.snapserve.ai/v1',
  snapserveApiKey: process.env.SNAPSERVE_API_KEY,
  snapserveAgentId: process.env.SNAPSERVE_AGENT_ID,

  vobizBaseUrl: process.env.VOBIZ_BASE_URL || 'https://api.vobiz.ai/v1',
  vobizAuthId: process.env.VOBIZ_AUTH_ID,
  vobizAuthToken: process.env.VOBIZ_AUTH_TOKEN,
  vobizNumber: process.env.VOBIZ_NUMBER || '+914400000000',
};
