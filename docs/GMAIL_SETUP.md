# Gmail Integration Guide

This guide describes how to configure Gmail ingestion for **Naga AI Assistant (Saranya)** to ensure only critical client communications are processed, avoiding spam, automated marketing, and promotional newsletters.

---

## 1. Google Cloud Console Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `naga-ai-assistant`).
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Gmail API** and click **Enable**.
4. Configure OAuth Consent Screen:
   - User Type: Internal (for Workspace) or External (with Naga's email added as Test User).
   - Scopes required: `https://www.googleapis.com/auth/gmail.readonly`.
5. Create Credentials:
   - Navigate to **Credentials** > **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Authorized Redirect URIs:
     - For n8n: `https://<YOUR_N8N_DOMAIN>/rest/oauth2-credential/callback`.

---

## 2. Ingestion Filtering Strategy

To prevent inbox overload and unnecessary AI costs:
1. **Gmail Label Enforcement**:
   - In Gmail, create a dedicated label: `Clients`.
   - Setup Gmail filters to automatically tag high-value client senders with `Clients`.
2. **Search Query Filter in n8n Trigger**:
   ```
   label:Clients -category:promotions -category:social -category:updates -category:forums
   ```
3. **Deterministic Backend Pre-Filter**:
   - Any message passing through with automated keywords (e.g. `unsubscribe`, `verification code`, `OTP`) is immediately filtered out before calling Gemini AI.
