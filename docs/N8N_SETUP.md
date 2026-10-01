# n8n Automation Engine Setup Guide

This document describes the end-to-end configuration of n8n for **Naga AI Assistant (Saranya)**, detailing node-by-node execution flow, webhook payload formats, signature authentication, and post-call feedback integration.

---

## 1. Complete Workflow Topology

```
[ Gmail Trigger (Label: Clients) ]      [ WhatsApp Business Trigger ]
                 │                                    │
                 └──────────────────┬─────────────────┘
                                    │
                                    ▼
                        [ 1. Clean Message Node ]
                         (Regex strip quotes & sigs)
                                    │
                                    ▼
                        [ 2. Normalize JSON Node ]
                         (Map sender, channel, text)
                                    │
                                    ▼
                     [ 3. Post to Naga Backend API ]
                      POST /api/webhooks/n8n/message
                                    │
                                    ▼
                       [ 4. IF (should_call == true) ]
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              [ 5. Log & End ]          [ 6. Voice Agent Call ]
               (should_call: false)      (SnapServe / Vobiz Call)
                                                   │
                                                   ▼
                                        [ 7. Post-Call Webhook ]
                                         POST /api/webhooks/post-call
                                                   │
                                                   ▼
                                        [ 8. Action Task Ingestion ]
```

---

## 2. Node-by-Node Detailed Breakdown

### Node 1: Gmail Trigger
- **Resource**: Message
- **Operation**: Message Received
- **Poll Times**: Every 1 minute (or Push notification via Google Cloud Pub/Sub)
- **Filters**:
  - Filter string: `label:Clients -category:promotions -category:spam`
- **Output**: Raw email body, subject, sender name, message ID.

### Node 2: WhatsApp Business Cloud Trigger
- **Webhook Path**: `webhook/whatsapp-inbound`
- **Verification Method**: GET challenge with `hub.verify_token` matching `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- **Event**: `messages`

### Node 3: Clean & Normalize Function Node
```javascript
// n8n Code Node (JavaScript)
const item = $json;
let cleanText = item.text || item.body || item.snippet || '';

// Remove quoted email chain lines starting with '>'
cleanText = cleanText.split('\n').filter(l => !l.trim().startsWith('>')).join('\n');

// Clean "On ... wrote:" patterns
cleanText = cleanText.replace(/On\s+[\w\s,]+wrote:[\s\S]*/gi, '');

return {
  json: {
    channel: item.channel || (item.fromEmail ? 'email' : 'whatsapp'),
    clientName: item.fromName || item.senderName || 'Client',
    clientContact: item.fromEmail || item.senderPhone || '',
    company: item.company || '',
    subject: item.subject || '',
    message: cleanText.trim(),
    sourceMessageId: item.id || item.messageId,
    timestamp: new Date().toISOString()
  }
};
```

### Node 4: HTTP Request to Saranya Backend
- **Method**: `POST`
- **URL**: `http://localhost:5001/api/webhooks/n8n/message`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-n8n-secret`: `{{$env.N8N_WEBHOOK_SECRET}}`
  - `x-idempotency-key`: `{{$json.sourceMessageId}}`
- **Body**: Standard JSON

### Node 5: Conditional Branching (IF Node)
- **Condition**: `{{$json.should_call}}` equals `true`
- **True Path**: Routes to Voice Briefing Trigger
- **False Path**: Message saved to Firestore with status `analyzed` or `ignored`.

### Node 6: Post-Call Instruction Capture Node
- Triggered upon call completion:
- **URL**: `http://localhost:5001/api/webhooks/post-call`
- **Body**:
  ```json
  {
    "callId": "{{$json.callId}}",
    "providerCallId": "{{$json.providerCallId}}",
    "status": "completed",
    "duration": "{{$json.duration}}",
    "transcript": "{{$json.transcript}}",
    "ownerInstruction": "{{$json.ownerInstruction}}"
  }
  ```
