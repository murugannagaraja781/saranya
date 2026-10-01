import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index';
import { logger } from '../../utils/logger';
import { MessageChannel, MessagePriority } from '../../types/shared';

export interface VoiceCallPayload {
  callId: string;
  ownerName: string;
  clientName: string;
  channel: MessageChannel;
  summary: string;
  nextStep: string;
  priority: MessagePriority;
  recipientPhone: string;
  deadline?: string;
}

export interface VoiceCallResult {
  providerCallId: string;
  status: 'pending' | 'calling' | 'answered' | 'completed' | 'failed';
  startedAt: string;
  simulatedTranscript?: string;
  simulatedOwnerInstruction?: string;
}

export interface VoiceProvider {
  name: string;
  createCall(payload: VoiceCallPayload): Promise<VoiceCallResult>;
  getCallStatus(providerCallId: string): Promise<string>;
  getCallTranscript(providerCallId: string): Promise<string>;
  endCall(providerCallId: string): Promise<boolean>;
}

/**
 * Mock Voice Provider for local development, demo mode, and offline testing.
 * Generates natural Chennai Tamil spoken conversation transcripts conforming to
 * Saranya's exact persona and rules.
 */
export class MockVoiceProvider implements VoiceProvider {
  public name = 'MockVoiceProvider';
  private calls = new Map<string, { status: string; transcript: string; instruction: string }>();

  public async createCall(payload: VoiceCallPayload): Promise<VoiceCallResult> {
    const providerCallId = `mock-snapserve-${uuidv4()}`;
    const channelInTamil = payload.channel === 'whatsapp' ? 'WhatsApp' : 'Email';

    const assistantName = config.assistantName || 'Arya';
    const greeting = `வணக்கம் ${payload.ownerName}! நான் ${assistantName}. உங்க client ${payload.clientName} கிட்ட இருந்து ${channelInTamil}-ல ஒரு முக்கியமான reply வந்திருக்கு.`;
    const explanation = payload.summary;
    const deadlineText = payload.deadline ? `Deadline: ${payload.deadline}.` : '';
    const question = `இதுக்கு நான் என்ன note பண்ணணும்?`;

    // Simulated owner instruction based on message priority/category
    let simulatedInstruction = 'Two installment okay என்று note பண்ணு.';
    if (payload.summary.includes('delivery')) {
      simulatedInstruction = 'Tomorrow 5 PM delivery confirm பண்ணு.';
    } else if (payload.priority === 'high' && payload.summary.includes('issue')) {
      simulatedInstruction = 'Tech team-ஐ உடனே fix பண்ண சொல்லு.';
    }

    const confirmation = `சரி ${payload.ownerName}. "${simulatedInstruction}"-ன்னு note பண்ணிட்டேன். Bye.`;

    const fullTranscript = [
      `${assistantName}: "${greeting}"`,
      `${assistantName}: "${explanation} ${deadlineText}"`,
      `${assistantName}: "${question}"`,
      `${payload.ownerName}: "${simulatedInstruction}"`,
      `${assistantName}: "${confirmation}"`
    ].join('\n\n');

    this.calls.set(providerCallId, {
      status: 'completed',
      transcript: fullTranscript,
      instruction: simulatedInstruction
    });

    logger.info('MockVoiceProvider successfully dispatched simulated call to Naga', {
      callId: payload.callId,
      providerCallId,
      recipientPhone: payload.recipientPhone,
      clientName: payload.clientName
    });

    return {
      providerCallId,
      status: 'completed',
      startedAt: new Date().toISOString(),
      simulatedTranscript: fullTranscript,
      simulatedOwnerInstruction: simulatedInstruction
    };
  }

  public async getCallStatus(providerCallId: string): Promise<string> {
    const call = this.calls.get(providerCallId);
    return call ? call.status : 'completed';
  }

  public async getCallTranscript(providerCallId: string): Promise<string> {
    const call = this.calls.get(providerCallId);
    return call ? call.transcript : 'Transcript unavailable.';
  }

  public async endCall(providerCallId: string): Promise<boolean> {
    const call = this.calls.get(providerCallId);
    if (call) {
      call.status = 'completed';
    }
    return true;
  }
}

/**
 * SnapServe AI Voice Provider
 * Production integration adapter for SnapServe AI voice agent.
 */
export class SnapServeVoiceProvider implements VoiceProvider {
  public name = 'SnapServeVoiceProvider';
  private baseUrl: string;
  private apiKey: string;
  private agentId: string;

  constructor() {
    this.baseUrl = config.snapserveBaseUrl;
    this.apiKey = config.snapserveApiKey || '';
    this.agentId = config.snapserveAgentId || '';
  }

  public async createCall(payload: VoiceCallPayload): Promise<VoiceCallResult> {
    if (!this.apiKey || !this.agentId) {
      throw new Error('SnapServe API Key or Agent ID is not configured.');
    }

    const callerVariables = {
      owner_name: payload.ownerName,
      client_name: payload.clientName,
      channel: payload.channel,
      summary: payload.summary,
      next_step: payload.nextStep,
      priority: payload.priority,
      deadline: payload.deadline || ''
    };

    logger.info('Initiating SnapServe voice agent call', {
      agentId: this.agentId,
      recipient: payload.recipientPhone,
      clientName: payload.clientName
    });

    const response = await axios.post(
      `${this.baseUrl}/agents/${this.agentId}/calls`,
      {
        recipient_phone: payload.recipientPhone,
        variables: callerVariables,
        metadata: {
          system_call_id: payload.callId,
          source: 'naga_ai_assistant'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      providerCallId: response.data?.call_id || response.data?.id,
      status: response.data?.status || 'calling',
      startedAt: new Date().toISOString()
    };
  }

  public async getCallStatus(providerCallId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/calls/${providerCallId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 5000
    });
    return response.data?.status || 'unknown';
  }

  public async getCallTranscript(providerCallId: string): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/calls/${providerCallId}/transcript`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 5000
    });
    return response.data?.transcript || '';
  }

  public async endCall(providerCallId: string): Promise<boolean> {
    await axios.post(
      `${this.baseUrl}/calls/${providerCallId}/terminate`,
      {},
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 5000
      }
    );
    return true;
  }
}

export function getVoiceProvider(): VoiceProvider {
  if (!config.mockMode && config.snapserveApiKey && config.snapserveAgentId) {
    return new SnapServeVoiceProvider();
  }
  return new MockVoiceProvider();
}
