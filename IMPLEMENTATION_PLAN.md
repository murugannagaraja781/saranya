# Naga AI Assistant — Saranya: Implementation Plan

## Project Identity
- **Application Name**: Naga AI Assistant
- **AI Assistant Persona**: Saranya (Personal AI Business Assistant for Naga)
- **Language**: Tamil (Conversational Chennai-style, written in Tamil script with common English business terms preserved)
- **Primary Owner**: Naga

---

## Architecture Overview
```
Client (Gmail / WhatsApp Business)
       │
       ▼
n8n Webhook / Ingestion
       │
       ▼
Message Cleaner (Strip signatures, quoted threads, prompt injection guard)
       │
       ▼
Deterministic Pre-Filter (Check OTP, spam, marketing before calling AI)
       │
       ▼
Gemini AI Analysis (Priority, Category, Spoken Tamil Summary, Decision)
       │
       ▼
Should Call Naga?
   ├── NO  ──► Save to Firestore / Ignore
   └── YES ──► Saranya Voice Agent (SnapServe AI / Mock)
                    │
                    ▼
               Telephony (Vobiz / Mock) ──► Phone Call to Naga
                    │
                    ▼
               Naga Instruction Captured
                    │
                    ▼
               Post-Call Webhook
                    │
                    ▼
               Firestore (Calls, Tasks, Messages, Audit Log)
                    │
                    ▼
               SaaS Dashboard (React + Vite + Material UI)
```

---

## 20-Phase Implementation Roadmap

- [x] **Phase 1: Project Setup & Monorepo Infrastructure**
  - Root configuration, client (Vite + React + TS + MUI), server (Express + TS)
  - Environment variable schemas (`.env.example` and development `.env`)
  - Shared types for models and API contracts in `shared/types.ts`

- [x] **Phase 2: Frontend Layout & Theme System**
  - Premium Light-theme Material UI palette (Clean SaaS, rounded cards, subtle shadows)
  - Responsive AppLayout (Sidebar drawer for mobile, persistent for desktop)
  - Header: "Naga AI Assistant", Search, Notifications, Profile, "Saranya Online" indicator
  - Navigation: Dashboard, Messages, Important Alerts, Clients, Call History, Tasks, AI Instructions, Integrations, Settings

- [x] **Phase 3: Authentication & Security Subsystem**
  - Firebase Authentication integration with seamless local Demo / Mock Auth provider
  - Session and user management for Naga

- [x] **Phase 4: Firestore Data Layer & Mock Storage**
  - Strong TypeScript interfaces: Users, Clients, Messages, AIAnalyses, Calls, Tasks, Notifications, Integrations, Settings, AuditLogs
  - Firestore repository with in-memory / local fallback when Firebase credentials are not provided

- [x] **Phase 5: Backend API Architecture**
  - Express server with Helmet, CORS, Rate Limiting, Request ID tracing, structured logging
  - REST endpoints for Dashboard, Messages, Clients, Calls, Tasks, Settings, Health

- [x] **Phase 6: Message Cleaning & Injection Protection**
  - Email cleaner: remove quoted threads (`On ... wrote:`), signatures, disclaimers
  - WhatsApp cleaner: text normalization, truncation
  - Prompt injection defense: treat client input strictly as untrusted data strings
  - Deterministic pre-filter: skip Gemini for OTPs, marketing, spam, newsletters

- [x] **Phase 7: Gemini AI Integration**
  - `GeminiService` implementation using Google Gen AI SDK
  - Structured JSON schema output (`should_call`, `priority`, `category`, `summary`, `next_step`, `deadline`, `reason`)
  - Spoken Tamil Chennai-style script generation
  - Deterministic MockGeminiService for `MOCK_MODE=true`

- [x] **Phase 8: n8n Webhook Integration**
  - Endpoints: `POST /api/webhooks/n8n/message`, `POST /api/webhooks/gmail`, `POST /api/webhooks/whatsapp`
  - Webhook signature verification, replay protection, and idempotency key handling

- [x] **Phase 9: Voice Provider Abstraction**
  - `VoiceProvider` interface (`createCall`, `getCallStatus`, `getCallTranscript`, `endCall`)
  - `MockVoiceProvider` for local simulations with interactive audio/script simulation

- [x] **Phase 10: Telephony Provider Abstraction**
  - `TelephonyProvider` interface (`getNumber`, `makeCall`, `getCallStatus`)
  - `MockTelephonyProvider` simulating E.164 call flows

- [x] **Phase 11: Call History Subsystem**
  - Call lifecycle management: Pending -> Calling -> Answered -> Completed / Missed / Failed
  - Call metadata and duration tracking

- [x] **Phase 12: Post-Call Process & Instruction Capture**
  - Webhook: `POST /api/webhooks/post-call`
  - Capture Naga's voice instructions in Tamil/English
  - Store transcript and instruction in Firestore

- [x] **Phase 13: Automated Task Management**
  - Automatic task creation from AI action / Naga instruction
  - Task lifecycle: Pending, In Progress, Completed, Cancelled

- [x] **Phase 14: SnapServe AI Adapter**
  - Production adapter for SnapServe voice agent
  - Caller variables mapping: `owner_name`, `client_name`, `channel`, `summary`, `next_step`, `priority`

- [x] **Phase 15: Vobiz Telephony Adapter**
  - Production telephony adapter with E.164 verification, auth tokens, caller ID

- [x] **Phase 16: Gmail Integration Documentation**
  - `docs/GMAIL_SETUP.md` with label filters, OAuth/service account, n8n trigger guides

- [x] **Phase 17: WhatsApp Business Integration Documentation**
  - `docs/WHATSAPP_SETUP.md` with Cloud API webhook verification, Meta app configuration

- [x] **Phase 18: Automated Testing**
  - Jest & Supertest suites:
    - Message cleaner and quoted email removal
    - Deterministic pre-filtering (OTP/spam)
    - Prompt injection resilience
    - AI JSON schema validation & Tamil summary rules
    - Call idempotency and task creation
    - Webhook endpoint validation

- [x] **Phase 19: Security Review & Audit Logging**
  - Sanitize logs (no secrets/passwords/tokens)
  - Audit logging for messages, calls, settings, and auth events
  - Firestore security rules definition

- [x] **Phase 20: Production Build & End-to-End Verification**
  - Full TypeScript compile, ESLint checks, Vite production bundle
  - Verification of the 10-step sample walkthrough test (ABC Traders quotation & installment call)
