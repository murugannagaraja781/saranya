# Google Gemini AI Integration Guide

This guide details configuring **Google Gemini** for **Naga AI Assistant (Saranya)**.

---

## 1. Obtaining Google Gemini Credentials

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** and generate a key for your project.
4. Add the key to your `.env`:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-1.5-flash
   MOCK_MODE=false
   ```

---

## 2. Model & Generation Configuration
- **Model**: `gemini-1.5-flash` (Optimized for ultra-low latency sub-second classification).
- **Temperature**: `0.2` (Low temperature ensures strict adherence to structured JSON schemas and deterministic category classification).
- **MIME Type**: `application/json` (Forces pure JSON output with zero markdown backticks).

---

## 3. Chennai Spoken Tamil Prompt Engineering

Saranya uses prompt engineering designed specifically for conversational Chennai-style Tamil:
1. **Tamil Script**: Spoken Tamil is transcribed strictly in Tamil alphabet (தமிழ் எழுத்துகள்), never Tanglish.
2. **Business Vocabulary Preservation**: Common business words remain in standard English to maintain natural executive flow:
   `client`, `payment`, `meeting`, `quotation`, `invoice`, `project`, `deadline`, `delivery`, `installment`, `confirm`, `OK`.
3. **Concise Briefings**: Summaries are limited to 2-3 short spoken sentences, leading with the decision or conclusion.
