export interface LogContext {
  requestId?: string;
  service?: string;
  event?: string;
  status?: 'success' | 'failure' | 'warning' | 'info';
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  'authorization',
  'api_key',
  'apikey',
  'token',
  'secret',
  'password',
  'private_key',
  'privatekey',
  'auth_token',
  'auth_id',
  'webhook_secret'
];

function sanitize(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k));
    if (isSensitive && typeof value === 'string') {
      cleanObj[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitize(value);
    } else {
      cleanObj[key] = value;
    }
  }
  return cleanObj;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...(context ? (sanitize(context) as Record<string, unknown>) : {})
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, context?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...(context ? (sanitize(context) as Record<string, unknown>) : {})
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: errorMessage,
      stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
      ...(context ? (sanitize(context) as Record<string, unknown>) : {})
    };
    console.error(JSON.stringify(entry));
  }
};
