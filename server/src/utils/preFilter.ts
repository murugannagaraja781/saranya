import { AIAnalysis, MessageCategory, MessagePriority } from '../types/shared';

export interface PreFilterResult {
  isFiltered: boolean;
  category?: MessageCategory;
  priority?: MessagePriority;
  should_call: boolean;
  reason?: string;
  summary?: string;
  next_step?: string;
}

export function evaluateDeterministicPreFilter(message: string, subject = ''): PreFilterResult {
  const combined = `${subject} ${message}`.toLowerCase().trim();
  const trimmedMsg = message.trim().toLowerCase();

  // 1. Trivial acknowledgments
  const ackRegex = /^(ok|okay|k|thanks|thank you|thx|noted|got it|cool|great|will do|sure)[\.!\s]*$/i;
  if (ackRegex.test(trimmedMsg)) {
    return {
      isFiltered: true,
      category: 'general',
      priority: 'low',
      should_call: false,
      reason: 'Deterministic filter: Simple conversational acknowledgment with no business action.',
      summary: 'கிளையண்ட் தகவலை ஏற்றுக்கொண்டார் (OK / Thanks). மேற்கொண்டு நடவடிக்கை தேவையில்லை.',
      next_step: 'No action required.'
    };
  }

  // 2. OTP & Two-Factor Authentication Codes
  const otpRegex = /(?:your\s+otp\s+is|verification\s+code\s+is|one-time\s+password|security\s+code\s+is|\botp:\s*\d{4,8}\b|\bcode:\s*\d{4,8}\b|do\s+not\s+share\s+this\s+code)/i;
  if (otpRegex.test(combined)) {
    return {
      isFiltered: true,
      category: 'otp',
      priority: 'low',
      should_call: false,
      reason: 'Deterministic filter: Automated OTP or authentication code.',
      summary: 'தானியங்கி OTP அல்லது சரிபார்ப்புக் குறியீடு வந்துள்ளது.',
      next_step: 'Ignore automated OTP.'
    };
  }

  // 3. Marketing & Promotional blasts
  const marketingRegex = /(?:flat\s+\d+%\s+off|exclusive\s+discount|limited\s+time\s+deal|buy\s+1\s+get\s+1|unsubscribe\s+here|click\s+here\s+to\s+unsubscribe|promotional\s+offer|sale\s+ends\s+tonight)/i;
  if (marketingRegex.test(combined)) {
    return {
      isFiltered: true,
      category: 'promotion',
      priority: 'low',
      should_call: false,
      reason: 'Deterministic filter: Promotional or marketing broadcast.',
      summary: 'விளம்பர செய்தி (Promotional offer).',
      next_step: 'Archived as promotion.'
    };
  }

  // 4. Automated Newsletters
  const newsletterRegex = /(?:weekly\s+digest|monthly\s+newsletter|view\s+in\s+browser|manage\s+your\s+email\s+preferences|newsletter\s+edition)/i;
  if (newsletterRegex.test(combined)) {
    return {
      isFiltered: true,
      category: 'newsletter',
      priority: 'low',
      should_call: false,
      reason: 'Deterministic filter: Automated subscription newsletter.',
      summary: 'செய்தி மடல் (Newsletter).',
      next_step: 'No action needed.'
    };
  }

  return { isFiltered: false, should_call: false };
}
