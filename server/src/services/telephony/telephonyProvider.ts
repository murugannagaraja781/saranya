import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index';
import { logger } from '../../utils/logger';

export interface TelephonyCallParams {
  to: string; // E.164 format e.g. +919876543210
  from?: string;
  webhookUrl?: string;
  extraParams?: Record<string, unknown>;
}

export interface TelephonyCallResult {
  callId: string;
  status: 'pending' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer';
  timestamp: string;
}

export interface TelephonyProvider {
  name: string;
  getNumber(): Promise<string>;
  makeCall(params: TelephonyCallParams): Promise<TelephonyCallResult>;
  getCallStatus(callId: string): Promise<string>;
}

export function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Mock Telephony Provider for local simulation and automated testing.
 */
export class MockTelephonyProvider implements TelephonyProvider {
  public name = 'MockTelephonyProvider';
  private callerNumber = '+914400000000';
  private callStatuses = new Map<string, string>();

  public async getNumber(): Promise<string> {
    return this.callerNumber;
  }

  public async makeCall(params: TelephonyCallParams): Promise<TelephonyCallResult> {
    if (!validateE164(params.to)) {
      throw new Error(`Invalid recipient phone number format "${params.to}". Telephony requires E.164.`);
    }

    const callId = `mock-vobiz-${uuidv4()}`;
    this.callStatuses.set(callId, 'completed');

    logger.info('MockTelephonyProvider placed test phone call', {
      to: params.to,
      from: this.callerNumber,
      callId
    });

    return {
      callId,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  public async getCallStatus(callId: string): Promise<string> {
    return this.callStatuses.get(callId) || 'completed';
  }
}

/**
 * Vobiz Telephony Provider
 * Production integration adapter for Vobiz telephony platform.
 */
export class VobizTelephonyProvider implements TelephonyProvider {
  public name = 'VobizTelephonyProvider';
  private baseUrl: string;
  private authId: string;
  private authToken: string;
  private callerNumber: string;

  constructor() {
    this.baseUrl = config.vobizBaseUrl;
    this.authId = config.vobizAuthId || '';
    this.authToken = config.vobizAuthToken || '';
    this.callerNumber = config.vobizNumber || '+914400000000';
  }

  public async getNumber(): Promise<string> {
    return this.callerNumber;
  }

  public async makeCall(params: TelephonyCallParams): Promise<TelephonyCallResult> {
    if (!this.authId || !this.authToken) {
      throw new Error('Vobiz Telephony credentials (Auth ID / Auth Token) are not configured.');
    }

    if (!validateE164(params.to)) {
      throw new Error(`Phone number "${params.to}" is not valid E.164 format. Example: +919876543210`);
    }

    const authHeader = Buffer.from(`${this.authId}:${this.authToken}`).toString('base64');

    logger.info('Triggering Vobiz outbound call', {
      to: params.to,
      from: this.callerNumber
    });

    const response = await axios.post(
      `${this.baseUrl}/Accounts/${this.authId}/Calls`,
      {
        to: params.to,
        from: params.from || this.callerNumber,
        answer_url: params.webhookUrl,
        ...params.extraParams
      },
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      callId: response.data?.call_uuid || response.data?.id,
      status: response.data?.status || 'ringing',
      timestamp: new Date().toISOString()
    };
  }

  public async getCallStatus(callId: string): Promise<string> {
    const authHeader = Buffer.from(`${this.authId}:${this.authToken}`).toString('base64');
    const response = await axios.get(
      `${this.baseUrl}/Accounts/${this.authId}/Calls/${callId}`,
      {
        headers: { Authorization: `Basic ${authHeader}` },
        timeout: 5000
      }
    );
    return response.data?.status || 'unknown';
  }
}

export function getTelephonyProvider(): TelephonyProvider {
  if (!config.mockMode && config.vobizAuthId && config.vobizAuthToken) {
    return new VobizTelephonyProvider();
  }
  return new MockTelephonyProvider();
}
