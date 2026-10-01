# WhatsApp Business Cloud API Integration Guide

This guide details configuring Meta's official WhatsApp Business Cloud Platform with **Naga AI Assistant (Saranya)**.

---

## 1. Prerequisites
- A Meta Developer Account at [developers.facebook.com](https://developers.facebook.com/).
- A Meta App of type **Business**.
- WhatsApp product added to the app.
- A verified phone number or test number assigned in the WhatsApp App Dashboard.

> **Important**: Personal WhatsApp accounts or unofficial web-scraping libraries cannot be used in production. Only official WhatsApp Business Cloud API endpoints provide high-reliability webhook delivery and SLA guarantees.

---

## 2. Webhook Configuration in Meta App Dashboard

1. Navigate to **WhatsApp** > **Configuration** in your Meta App dashboard.
2. In the **Webhook** section, click **Edit**:
   - **Callback URL**: `https://<YOUR_DOMAIN>/api/webhooks/whatsapp`
   - **Verify Token**: Must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env` (e.g. `dev_whatsapp_verify_token_12345`).
3. Click **Verify and Save**. Meta will send a GET challenge request which Saranya's backend automatically validates.
4. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (inbound client replies)

---

## 3. Webhook Payload Normalization
When a client sends a message, Meta delivers a JSON payload with the format:
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "contacts": [{ "profile": { "name": "Ramesh" }, "wa_id": "919840123456" }],
            "messages": [
              {
                "from": "919840123456",
                "id": "wamid.HBgLM...",
                "timestamp": "1727544000",
                "text": { "body": "Hi Naga, quotation approved. We need two payment installments." },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```
Saranya automatically normalizes this into `InboundMessagePayload`, strips control characters, runs deterministic pre-filtering, and initiates AI reasoning.
