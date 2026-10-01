# SnapServe AI Voice Provider Integration Guide

This guide details configuring **SnapServe AI** for **Naga AI Assistant (Saranya)**.

---

## 1. Provider Abstraction
Saranya connects to voice platforms via the pluggable `VoiceProvider` interface:
```typescript
export interface VoiceProvider {
  name: string;
  createCall(payload: VoiceCallPayload): Promise<VoiceCallResult>;
  getCallStatus(providerCallId: string): Promise<string>;
  getCallTranscript(providerCallId: string): Promise<string>;
  endCall(providerCallId: string): Promise<boolean>;
}
```

When credentials are not set or when `MOCK_MODE=true`, `MockVoiceProvider` executes locally, simulating the complete Chennai Tamil dialogue script and capturing mock instructions without incurring provider costs.

---

## 2. SnapServe AI Setup

1. Register at [SnapServe AI](https://snapserve.ai/).
2. Create a new Voice Agent:
   - **Agent Name**: Saranya
   - **Language**: Tamil (India)
   - **Voice**: Conversational Female (Tamil)
   - **Prompt**: Import Saranya persona rules from `docs/ARCHITECTURE.md`.
3. In your `.env`:
   ```bash
   SNAPSERVE_BASE_URL=https://api.snapserve.ai/v1
   SNAPSERVE_API_KEY=your_snapserve_api_key_here
   SNAPSERVE_AGENT_ID=agent_saranya_tamil_01
   MOCK_MODE=false
   ```

---

## 3. Dynamic Caller Variables Passed to Saranya
Every outbound call receives standard runtime variables:
- `owner_name`: `Naga`
- `client_name`: Client's full or business name
- `channel`: `WhatsApp` or `Email`
- `summary`: Spoken Chennai Tamil briefing script
- `next_step`: Concrete business action required
- `priority`: `high` or `normal`
- `deadline`: Target completion timeframe
