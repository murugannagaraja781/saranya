# Naga AI Assistant — Saranya: Architecture Specification

## 1. System Overview
**Naga AI Assistant (Saranya)** is a production-grade personal AI business assistant designed for Naga. Saranya autonomously monitors important client communications across Gmail and WhatsApp Business, extracts the critical message context, filters out noise and prompt injections, runs deep semantic reasoning via Google Gemini, synthesizes a 2-3 sentence conversational Chennai Tamil briefing, decides whether an immediate phone call is required, places a voice call to Naga via SnapServe AI and Vobiz telephony (or deterministic mock providers in local mode), captures Naga's voice instructions, and tracks actions, calls, and tasks on a modern, light-theme SaaS dashboard.

---

## 2. End-to-End Workflow Architecture

```
                  ┌────────────────────────┐       ┌────────────────────────┐
                  │      Gmail API /       │       │    WhatsApp Cloud      │
                  │   Google Workspace     │       │     Business API       │
                  └───────────┬────────────┘       └───────────┬────────────┘
                              │                                │
                              ▼                                ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                 n8n Automation Engine                   │
                  │  - Ingests triggers (Label: Clients / Inbound WhatsApp) │
                  │  - Dispatches standardized webhook to Naga Backend      │
                  └───────────────────────────┬─────────────────────────────┘
                                              │ POST /api/webhooks/n8n/message
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Naga Express Backend                    │
                  │ 1. Signature & Replay Verification                      │
                  │ 2. Idempotency Check (Prevent duplicate calls)          │
                  │ 3. Message Cleaning & Normalization                     │
                  │    - Strip quoted email chains & signatures             │
                  │    - Prompt injection barrier (Untrusted payload)       │
                  │ 4. Deterministic Pre-Filtering                          │
                  │    - Fast reject: OTP, Spam, Marketing, Simple Acks     │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             Google Gemini AI Engine                     │
                  │ - Structured JSON Schema enforcement                    │
                  │ - Category classification & Priority assessment         │
                  │ - Chennai Spoken Tamil summary generation               │
                  │ - should_call evaluation (Financial, Urgency, Blockers) │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ├──────────────────────────┐
                                              │ should_call == false     │ should_call == true
                                              ▼                          ▼
                                   ┌──────────────────────┐  ┌──────────────────────┐
                                   │ Save to Firestore    │  │ Voice Provider       │
                                   │ Status: Ignored/Saved│  │ (SnapServe / Mock)   │
                                   └──────────────────────┘  └──────────┬───────────┘
                                                                        │
                                                                        ▼
                                                             ┌──────────────────────┐
                                                             │ Telephony Provider   │
                                                             │ (Vobiz / Mock)       │
                                                             └──────────┬───────────┘
                                                                        │ E.164 Call
                                                                        ▼
                                                             ┌──────────────────────┐
                                                             │      Naga Phone      │
                                                             │ Saranya Tamil Script │
                                                             └──────────┬───────────┘
                                                                        │ Instruction
                                                                        ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              Post-Call Webhook Ingestion                │
                  │ - Transcripts, Duration, Naga's Spoken Instruction      │
                  │ - Auto-create high-priority Action Task                 │
                  │ - Audit logging & System notification                   │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Firestore Data Store                    │
                  │ Users | Clients | Messages | AIAnalyses | Calls | Tasks │
                  └───────────────────────────┬─────────────────────────────┘
                                              │ Realtime / REST API
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │           React + Vite + Material UI Dashboard          │
                  │ 9 Navigation Sections | Light Theme | Responsive Drawer │
                  └─────────────────────────────────────────────────────────┘
```

---

## 3. Provider Abstractions

### 3.1 Voice Provider Interface
```typescript
export interface VoiceCallPayload {
  callId: string;
  ownerName: string; // 'Naga'
  clientName: string;
  channel: 'email' | 'whatsapp';
  summary: string;     // Spoken Chennai Tamil script
  nextStep: string;
  priority: 'high' | 'normal' | 'low';
  recipientPhone: string;
}

export interface VoiceCallResult {
  providerCallId: string;
  status: 'pending' | 'calling' | 'answered' | 'completed' | 'failed';
  startedAt: string;
}

export interface VoiceProvider {
  name: string;
  createCall(payload: VoiceCallPayload): Promise<VoiceCallResult>;
  getCallStatus(providerCallId: string): Promise<string>;
  getCallTranscript(providerCallId: string): Promise<string>;
  endCall(providerCallId: string): Promise<boolean>;
}
```

### 3.2 Telephony Provider Interface
```typescript
export interface TelephonyCallParams {
  to: string;   // E.164 formatted (+91...)
  from: string; // Verified caller ID
  webhookUrl: string;
}

export interface TelephonyProvider {
  name: string;
  getNumber(): Promise<string>;
  makeCall(params: TelephonyCallParams): Promise<{ callId: string; status: string }>;
  getCallStatus(callId: string): Promise<string>;
}
```

---

## 4. Deterministic Pre-Filtering & AI Cost Control
To minimize unnecessary Gemini API consumption and prevent unintended phone calls:
1. **Regular Expression Fast Checks**:
   - OTP detection: `\b(otp|verification code|one time password|\d{4,6})\b` with automated auth context
   - Newsletter / Unsubscribe headers: `unsubscribe|list-unsubscribe|manage preferences`
   - Marketing buzzwords: `flat \d+% off|limited time offer|deal of the day`
   - Trivial acknowledgements: `^(ok|thanks|thank you|noted|k|great|thumbs up)[\.!\s]*$`
2. **Result**: Messages matching these criteria are saved as `priority: 'low'`, `category: 'spam' | 'otp' | 'promotion' | 'general'`, `should_call: false`, without invoking Gemini.

---

## 5. Security & Isolation Architecture
1. **Prompt Injection Guard**:
   - The user message is strictly bounded in XML tags `<untrusted_client_message>` with system instructions explicitly stating that client text must never override Saranya's persona, system instructions, or security parameters.
2. **Secret Separation**:
   - Frontend only accesses Firebase public config (`VITE_FIREBASE_*`).
   - Server holds `GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `SNAPSERVE_API_KEY`, `VOBIZ_AUTH_TOKEN`, and `N8N_WEBHOOK_SECRET`.
3. **Structured Logging**:
   - Automatic redaction of passwords, tokens, API keys, and authorization headers from logs.
