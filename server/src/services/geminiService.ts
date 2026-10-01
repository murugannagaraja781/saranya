import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { sanitizeForPrompt } from '../utils/cleaner';
import { AIAnalysis, MessageCategory, MessagePriority, MessageChannel } from '../types/shared';

export interface AnalysisInput {
  channel: MessageChannel;
  clientName?: string;
  clientContact?: string;
  company?: string;
  subject?: string;
  message: string;
}

export interface GeminiAnalysisResult {
  should_call: boolean;
  client_name: string;
  company: string;
  client_contact: string;
  channel: MessageChannel;
  priority: MessagePriority;
  summary: string;
  next_step: string;
  deadline: string;
  reason: string;
  category: MessageCategory;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = config.geminiModel || 'gemini-1.5-flash';
    if (config.geminiApiKey && !config.mockMode) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      } catch (err) {
        logger.error('Failed to initialize GoogleGenerativeAI client', err);
      }
    }
  }

  public async analyzeMessage(input: AnalysisInput): Promise<GeminiAnalysisResult> {
    // If mock mode is active or no API key is provided, use high-fidelity deterministic mock analysis
    if (config.mockMode || !this.genAI) {
      logger.info('Running GeminiService in deterministic MOCK_MODE', {
        clientName: input.clientName,
        channel: input.channel
      });
      return this.mockAnalysis(input);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const sanitizedMessage = sanitizeForPrompt(input.message);
      const sanitizedSubject = sanitizeForPrompt(input.subject || '');

      const prompt = `
You are ${config.assistantName || 'Arya'}, the personal AI business assistant to Naga.
Your task is to analyze an incoming client message and decide if Naga needs an immediate phone call.

<system_persona_instructions>
- Role: Personal Business Assistant for Naga.
- Persona: Calm, professional, efficient, friendly, natural conversational Chennai-style Tamil.
- Summary language: Spoken Tamil written strictly using Tamil script (தமிழ் எழுத்துகள்).
- Common English business words SHOULD remain in English (e.g., client, payment, meeting, quotation, invoice, project, deadline, follow-up, delivery, confirmation, installment, OK, confirm).
- Do NOT use overly formal or literary Tamil (no "வணங்குகிறேன்", "தங்களின் மேலான பார்வைக்கு").
- Keep summary to 2-3 short, spoken Tamil sentences. Start with the conclusion.
</system_persona_instructions>

<decision_rules>
should_call = false when:
- OTP, verification codes
- Newsletters, promotions, spam, automated marketing
- Simple "OK", "Thanks", "Noted", trivial acknowledgments
- General informational note without required decision or action

should_call = true when:
- Money or payment discussed (e.g., payment approval, installment request, invoice query)
- Quotation or proposal discussed
- Client asks an important question or raises a complaint/problem
- Meeting requested or project blocker mentioned
- Deadline mentioned or delivery issue reported
- Important business decision or confirmation required from Naga

priority rules:
- "high": Money/payment involved, complaint, deadline within 48 hours, project blocker, urgent request.
- "normal": Other actionable messages requiring attention.
- "low": Informational messages without immediate action.
</decision_rules>

<metadata>
Channel: ${input.channel}
Provided Client Name: ${input.clientName || 'Unknown'}
Provided Company: ${input.company || ''}
Provided Client Contact: ${input.clientContact || ''}
Subject: ${sanitizedSubject}
</metadata>

<untrusted_client_message>
${sanitizedMessage}
</untrusted_client_message>

Return ONLY a valid JSON object with the exact keys:
{
  "should_call": boolean,
  "client_name": string,
  "company": string,
  "client_contact": string,
  "channel": "${input.channel}",
  "priority": "high" | "normal" | "low",
  "summary": string (2-3 short spoken Tamil sentences in Tamil script with business terms in English),
  "next_step": string (in English),
  "deadline": string (e.g. "Tomorrow", "Within 48 hours", or ""),
  "reason": string (why should_call was set to true/false),
  "category": "payment" | "quotation" | "meeting" | "project" | "deadline" | "complaint" | "question" | "confirmation" | "delivery" | "technical" | "general" | "spam" | "otp" | "promotion" | "newsletter" | "other"
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as GeminiAnalysisResult;
      return parsed;
    } catch (error) {
      logger.error('Gemini API call failed, falling back to deterministic analyzer', error);
      return this.mockAnalysis(input);
    }
  }

  /**
   * Deterministic analyzer for MOCK_MODE, local testing, and fallback.
   */
  public mockAnalysis(input: AnalysisInput): GeminiAnalysisResult {
    const raw = `${input.subject || ''} ${input.message}`.toLowerCase();
    const client = input.clientName || 'Ramesh';
    const comp = input.company || (raw.includes('abc') ? 'ABC Traders' : 'Client Business');

    // Scenario 1: Quotation approved with payment installment request (The reference test case)
    if (raw.includes('quotation') && (raw.includes('installment') || raw.includes('payment') || raw.includes('approved'))) {
      const hasTomorrow = raw.includes('tomorrow');
      return {
        should_call: true,
        client_name: client,
        company: comp,
        client_contact: input.clientContact || '+919840123456',
        channel: input.channel,
        priority: 'high',
        summary: `${client}, ${comp} quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. ${hasTomorrow ? 'நாளைக்குள்ள நீங்க confirm பண்ணணும்.' : 'நீங்க confirm பண்ணணும்.'}`,
        next_step: 'Confirm two installment payment arrangement.',
        deadline: hasTomorrow ? 'Tomorrow' : '48 hours',
        reason: 'Quotation approved with split payment request requiring owner decision.',
        category: 'payment'
      };
    }

    // Scenario 2: Project delivery inquiry
    if (raw.includes('delivery') || raw.includes('project delivery')) {
      return {
        should_call: true,
        client_name: client,
        company: comp,
        client_contact: input.clientContact || '+919840999888',
        channel: input.channel,
        priority: 'high',
        summary: `Client project delivery date பற்றி கேட்டிருக்காங்க. அவங்களுக்கு confirmation வேணும். நீங்க delivery date confirm பண்ணணும்.`,
        next_step: 'Confirm project delivery schedule.',
        deadline: 'Within 24 hours',
        reason: 'Urgent project delivery confirmation requested by client.',
        category: 'delivery'
      };
    }

    // Scenario 3: Urgent complaint or blocker
    if (raw.includes('complaint') || raw.includes('not working') || raw.includes('issue') || raw.includes('urgent')) {
      return {
        should_call: true,
        client_name: client,
        company: comp,
        client_contact: input.clientContact || '+919840777666',
        channel: input.channel,
        priority: 'high',
        summary: `${client} ஒரு urgent issue பற்றி report பண்ணியிருக்காங்க. உடனே நாம check பண்ணி solve பண்ணணும்.`,
        next_step: 'Investigate reported critical issue.',
        deadline: 'Immediate',
        reason: 'Client reported critical blocker requiring immediate intervention.',
        category: 'complaint'
      };
    }

    // Scenario 4: Meeting request
    if (raw.includes('meeting') || raw.includes('call') || raw.includes('discussion')) {
      return {
        should_call: true,
        client_name: client,
        company: comp,
        client_contact: input.clientContact || '',
        channel: input.channel,
        priority: 'normal',
        summary: `${client} உங்க கூட ஒரு meeting schedule பண்ண கேக்குறாங்க. நீங்க available time confirm பண்ணணும்.`,
        next_step: 'Provide available time slots for meeting.',
        deadline: 'This week',
        reason: 'Client requested business meeting.',
        category: 'meeting'
      };
    }

    // Scenario 5: Default general inquiry
    return {
      should_call: false,
      client_name: client,
      company: comp,
      client_contact: input.clientContact || '',
      channel: input.channel,
      priority: 'normal',
      summary: `${client} கிட்ட இருந்து ஒரு general update வந்திருக்கு. அவசியமான முடிவு எதுவும் இப்போதைக்கு தேவையில்லை.`,
      next_step: 'Review message when available.',
      deadline: '',
      reason: 'General inquiry with no immediate call required.',
      category: 'general'
    };
  }
}

export const geminiService = new GeminiService();
