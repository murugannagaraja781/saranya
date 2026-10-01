import request from 'supertest';
import app from '../src/index';
import { firestoreService } from '../src/services/db/firestoreService';
import { config } from '../src/config/index';

describe('Naga AI Assistant End-to-End Workflow Tests', () => {
  beforeAll(() => {
    (config as any).mockMode = true;
  });

  beforeEach(() => {
    // Reset seed data
    (firestoreService as any).seedDefaultData();
  });

  test('GET /api/health returns healthy and mock status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain(config.assistantName);
    expect(res.body.mockMode).toBe(true);
  });

  test('GET /api/dashboard/stats returns operational metrics', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messagesToday');
    expect(res.body).toHaveProperty('callsMade');
    expect(res.body).toHaveProperty('pendingActions');
    expect(res.body.systemStatus.saranyaStatus).toBe('ONLINE');
  });

  test('SECTION 59 & 73 Verification: Inbound Quotation & Split Payment workflow', async () => {
    // Step 1 & 2: Send test client message
    const payload = {
      channel: 'whatsapp',
      clientName: 'Ramesh',
      company: 'ABC Traders',
      clientContact: '+919840123456',
      subject: 'Quotation Update',
      message: 'Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow.'
    };

    // Step 3 & 4: Inbound webhook executes
    const res = await request(app)
      .post('/api/webhooks/n8n/message')
      .set('x-n8n-secret', 'dev_n8n_secret_token_12345')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.should_call).toBe(true);
    expect(res.body.priority).toBe('high');
    expect(res.body.callTriggered).toBe(true);
    expect(res.body).toHaveProperty('callId');
    expect(res.body).toHaveProperty('taskId');

    // Step 5: Verify Tamil summary conforms to spoken Chennai Tamil rules
    const analysis = res.body.analysis;
    expect(analysis.category).toBe('payment');
    expect(analysis.summary).toContain('quotation');
    expect(analysis.summary).toContain('installment');
    // Verify Tamil script is present
    expect(/[\u0B80-\u0BFF]/.test(analysis.summary)).toBe(true);

    // Step 6 & 7: Verify Call Record in Firestore
    const callRes = await request(app).get(`/api/calls/${res.body.callId}`);
    expect(callRes.status).toBe(200);
    expect(callRes.body.clientName).toBe('Ramesh');
    expect(callRes.body.phoneNumber).toBe(config.ownerPhone);
    expect(callRes.body.status).toBe('completed');
    expect(callRes.body.transcript).toContain(`வணக்கம் Naga! நான் ${config.assistantName}.`);

    // Step 8 & 9: Verify Task Creation
    const taskRes = await request(app).get(`/api/tasks`);
    expect(taskRes.status).toBe(200);
    const createdTask = taskRes.body.find((t: any) => t.id === res.body.taskId);
    expect(createdTask).toBeDefined();
    expect(createdTask.priority).toBe('high');
    expect(createdTask.status).toBe('pending');
  });

  test('Post-call webhook updates call duration, transcript and records instruction', async () => {
    // 1. Fetch an existing call
    const callsRes = await request(app).get('/api/calls');
    const existingCall = callsRes.body[0];

    // 2. Trigger post-call webhook
    const postCallPayload = {
      callId: existingCall.id,
      providerCallId: existingCall.providerCallId,
      status: 'completed',
      duration: 45,
      transcript: `${config.assistantName}: வணக்கம் Naga... Naga: Two installment okay.`,
      ownerInstruction: 'Two installment okay.'
    };

    const webhookRes = await request(app)
      .post('/api/webhooks/post-call')
      .send(postCallPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.call.ownerInstruction).toBe('Two installment okay.');
    expect(webhookRes.body.call.duration).toBe(45);
  });
});
