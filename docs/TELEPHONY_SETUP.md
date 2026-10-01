# Vobiz Telephony Provider Integration Guide

This guide details configuring **Vobiz Telephony** for **Naga AI Assistant (Saranya)**.

---

## 1. Provider Abstraction
Saranya uses a dedicated `TelephonyProvider` abstraction:
```typescript
export interface TelephonyProvider {
  name: string;
  getNumber(): Promise<string>;
  makeCall(params: TelephonyCallParams): Promise<TelephonyCallResult>;
  getCallStatus(callId: string): Promise<string>;
}
```

---

## 2. Vobiz Account Setup

1. Register at [Vobiz](https://vobiz.ai/).
2. Obtain your API credentials from the dashboard:
   - **Auth ID**: Found under Account Settings.
   - **Auth Token**: Secure API secret token.
   - **Caller ID Number**: Verified virtual phone number in E.164 format (e.g. `+914400000000`).
3. Set environment variables in `.env`:
   ```bash
   VOBIZ_BASE_URL=https://api.vobiz.ai/v1
   VOBIZ_AUTH_ID=vobiz_auth_id_here
   VOBIZ_AUTH_TOKEN=vobiz_auth_token_here
   VOBIZ_NUMBER=+914400000000
   OWNER_PHONE=+919876543210
   MOCK_MODE=false
   ```

---

## 3. Strict E.164 Format Requirement
All recipient and caller phone numbers must adhere to the international E.164 telephone number standard:
- Prefix with `+`
- Country code without leading zeros (e.g. `+91` for India)
- Followed by the 10-digit subscriber number
- **Valid Example**: `+919876543210`
- **Invalid Example**: `09876543210` or `9876543210`
