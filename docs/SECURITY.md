# Security & Threat Model Specification

This document details the security architecture and defensive controls implemented within **Naga AI Assistant (Saranya)**.

---

## 1. Secret Isolation & Zero-Leakage Architecture

1. **Frontend / Backend Boundary**:
   - The Vite frontend only receives public config parameters (`VITE_API_BASE_URL`, `VITE_FIREBASE_*`).
   - All critical secrets (`GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `SNAPSERVE_API_KEY`, `VOBIZ_AUTH_TOKEN`, `N8N_WEBHOOK_SECRET`) reside exclusively on the server.
2. **Structured Log Redaction**:
   - The structured logger automatically scrubs values associated with sensitive keys (`password`, `token`, `secret`, `api_key`, `authorization`, `private_key`) before logging.

---

## 2. Prompt Injection Defense (Untrusted Input)

Incoming client messages are strictly untrusted external content.
1. **Delimited Context Isolation**:
   - Inbound client text is isolated inside `<untrusted_client_message>` XML tags.
   - Any malicious strings attempting to close or escape tags (e.g., `</untrusted_client_message>`, `<system_instructions>`) are neutralized prior to LLM evaluation via `sanitizeForPrompt()`.
2. **System Persona Immutability**:
   - System prompt instructions explicitly enforce that no client message can modify system rules, database permissions, API credentials, or voice configurations.

---

## 3. Webhook Authentication & Replay Protection

1. **n8n Webhook**:
   - Requires matching `x-n8n-secret` header against `N8N_WEBHOOK_SECRET`.
   - Idempotency key tracking prevents duplicate invocation when webhooks retry.
2. **WhatsApp Webhook**:
   - GET verification challenge matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - Idempotency keyed on Meta message ID (`wamid...`).

---

## 4. DDoS & Abuse Protection

1. **Rate Limiting**:
   - General API: 300 requests / 15 minutes per IP.
   - Webhook Endpoints: 120 requests / 1 minute per IP.
2. **Input Truncation**:
   - Maximum payload size clamped at 2MB.
   - WhatsApp message text clamped at 2,500 characters to prevent buffer and token exhaustion attacks.
3. **HTTP Hardening**:
   - Helmet protection active across all endpoints.
   - CORS strictly restricted to authorized domains.
