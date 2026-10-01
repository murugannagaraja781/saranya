# Naga AI Assistant — Saranya

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **Naga AI Assistant (Saranya)** is a production-grade personal AI business voice assistant designed for **Naga**. Saranya monitors client communications across **Gmail** and **WhatsApp Business Cloud**, understands message context, synthesizes concise spoken **Chennai Tamil briefings** (transcribed in Tamil script), evaluates urgency and business impact, places outbound phone calls to Naga via **SnapServe AI** and **Vobiz Telephony** (or zero-cost local mock adapters), captures Naga's voice instructions, and tracks actions, calls, and tasks on a modern, light-theme SaaS dashboard.

---

## 1. System Architecture

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
                  │ 2. Idempotency Check (Duplicate call prevention)        │
                  │ 3. Message Cleaning (Strip email quotes & signatures)   │
                  │ 4. Deterministic Pre-Filtering (Fast OTP/spam skip)     │
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
                                                                        │ E.164 Outbound Call
                                                                        ▼
                                                             ┌──────────────────────┐
                                                             │      Naga Phone      │
                                                             │ (+919876543210)      │
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

## 2. Core Features & Capabilities

- **Natural Chennai Spoken Tamil**:
  Saranya speaks in natural conversational Chennai-style Tamil, strictly transcribed in Tamil script (தமிழ் எழுத்துகள்). Standard English business vocabulary is preserved (`client`, `payment`, `meeting`, `quotation`, `invoice`, `project`, `deadline`, `delivery`, `installment`, `confirm`, `OK`) to avoid clumsy or literary translations.
- **Concise Briefings (< 25 words/turn)**:
  Conversations lead with the conclusion and required action rather than reciting lengthy emails.
- **Deterministic Pre-Filter (Cost & Speed Optimization)**:
  Auto-detects and categorizes OTPs, subscription newsletters, promotional blasts, and trivial acknowledgments ("OK", "Thanks") without making costly Gemini AI API calls.
- **Prompt Injection Defense**:
  Treats all client messages as untrusted data inputs, safely neutralizing tags and preventing override of system persona or security rules.
- **Zero-Cost Mock Mode (`MOCK_MODE=true`)**:
  Runs 100% locally out of the box with deterministic simulation algorithms and full mock data without requiring paid API credentials.
- **Light Theme Modern SaaS Dashboard**:
  Built with React 18, TypeScript, Vite, and Material UI with 9 primary navigation sections, responsive mobile drawer, interactive inbound message simulation dialog, and full Tamil transcript modals.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Material UI (MUI v6), React Router v6, TanStack Query, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Helmet, CORS, Express Rate Limit |
| **Database** | Firebase Firestore (live SDK integration + high-fidelity in-memory mock repository) |
| **Authentication** | Firebase Authentication (with local dev session provider) |
| **AI Reasoning** | Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`) |
| **Automation** | n8n Automation Engine |
| **Voice Provider** | Pluggable interface: `SnapServeVoiceProvider` & `MockVoiceProvider` |
| **Telephony** | Pluggable interface: `VobizTelephonyProvider` & `MockTelephonyProvider` |
| **Testing** | Jest, ts-jest, Supertest |

---

## 4. Getting Started (Local Development)

### 4.1 Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 4.2 Installation
```bash
# 1. Clone repository
git clone <repository-url>
cd saranya

# 2. Install dependencies across root, server, and client
npm install

# 3. Configure environment
cp .env.example .env
```

### 4.3 Running Locally
```bash
# Start backend (port 5001) and frontend (port 5173) concurrently:
npm run dev
```

Visit **`http://localhost:5173`** in your browser. The dashboard will load with live mock data and full interactive controls!

---

## 5. Running the Test Suite

```bash
# Run unit and integration tests with Jest & Supertest:
npm test
```

### Key Tests Verified:
- Quoted email thread stripping (`On ... wrote:` and `-----Original Message-----`)
- Email signature & confidentiality disclaimer removal
- WhatsApp message normalization & DoS length clamping
- XML prompt injection neutralization
- Deterministic pre-filter (OTP, marketing, simple acknowledgments)
- End-to-end inbound workflow (Section 59 reference case: quotation approval + two installments request → voice briefing dispatch → transcript capture → task creation)
- Post-call webhook instruction capture

---

## 6. Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `MOCK_MODE` | Enable deterministic offline mock mode | `true` |
| `PORT` | Backend server port | `5001` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:5173` |
| `OWNER_NAME` | Name of the business owner | `Naga` |
| `OWNER_PHONE` | Recipient phone number in E.164 format | `+919876543210` |
| `AI_ASSISTANT_NAME` | AI voice persona name | `Saranya` |
| `AI_LANGUAGE` | Assistant primary language | `Tamil` |
| `QUIET_HOURS_START` | Quiet hours begin time (24h) | `22:00` |
| `QUIET_HOURS_END` | Quiet hours end time (24h) | `07:00` |
| `ALLOW_HIGH_PRIORITY_IN_QUIET_HOURS` | Allow urgent calls during quiet hours | `true` |
| `N8N_WEBHOOK_SECRET` | Shared secret header (`x-n8n-secret`) | `dev_n8n_secret_token_12345` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta WhatsApp webhook verify token | `dev_whatsapp_verify_token_12345` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | *(Optional in mock mode)* |
| `GEMINI_MODEL` | Gemini Model ID | `gemini-1.5-flash` |
| `FIREBASE_PROJECT_ID` | Google Cloud Firebase Project ID | *(Optional in mock mode)* |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Service Account Email | *(Optional in mock mode)* |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Service Account Private Key | *(Optional in mock mode)* |
| `SNAPSERVE_API_KEY` | SnapServe AI Voice Agent API Key | *(Optional in mock mode)* |
| `SNAPSERVE_AGENT_ID` | SnapServe Agent UUID | *(Optional in mock mode)* |
| `VOBIZ_AUTH_ID` | Vobiz Telephony Auth ID | *(Optional in mock mode)* |
| `VOBIZ_AUTH_TOKEN` | Vobiz Telephony Auth Token | *(Optional in mock mode)* |
| `VOBIZ_NUMBER` | Vobiz Caller ID in E.164 format | `+914400000000` |

---

## 7. Connecting Production Services

To switch from Mock Mode to production integrations:
1. Set `MOCK_MODE=false` in `.env`.
2. Provide your real API keys for Gemini, Firebase, SnapServe, and Vobiz.
3. Consult the detailed integration documentation:
   - [Architecture Specification](file:///Users/wohozo/Documents/saranya/docs/ARCHITECTURE.md)
   - [n8n Automation Setup](file:///Users/wohozo/Documents/saranya/docs/N8N_SETUP.md)
   - [Gmail Ingestion Setup](file:///Users/wohozo/Documents/saranya/docs/GMAIL_SETUP.md)
   - [WhatsApp Business Setup](file:///Users/wohozo/Documents/saranya/docs/WHATSAPP_SETUP.md)
   - [Google Gemini Setup](file:///Users/wohozo/Documents/saranya/docs/GEMINI_SETUP.md)
   - [SnapServe AI Voice Setup](file:///Users/wohozo/Documents/saranya/docs/VOICE_SETUP.md)
   - [Vobiz Telephony Setup](file:///Users/wohozo/Documents/saranya/docs/TELEPHONY_SETUP.md)
   - [Security & Threat Model](file:///Users/wohozo/Documents/saranya/docs/SECURITY.md)
   - [Production Deployment](file:///Users/wohozo/Documents/saranya/docs/DEPLOYMENT.md)

---

## 8. Verification Walkthrough (Section 59 & 73)

You can verify the reference business workflow directly in the dashboard:
1. Open the dashboard at `http://localhost:5173`.
2. Click **"Simulate Client Reply"** in the top navigation bar.
3. Select the template: **"Quotation Approved (Two Installments) - High Priority"**:
   - **Sender**: Ramesh (ABC Traders)
   - **Message**: *"Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow."*
4. Click **"Send to Pipeline"**.
5. Observe the automated execution:
   - AI determines `should_call = true`, `priority = high`, `category = payment`.
   - Saranya generates spoken Chennai Tamil summary:
     *"Ramesh, ABC Traders quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. நாளைக்குள்ள நீங்க confirm பண்ணணும்."*
   - Voice agent dispatches telephone briefing to Naga (+919876543210).
   - Naga's verbal reply captured: *"Two installment okay என்று note பண்ணு."*
   - High-priority action task created on the dashboard.
   - Call recorded in Call History with full interactive transcript.

---

## 9. Hostinger Shared Web Hosting & Subdomain Deployment Guide

This project includes a production-ready PHP + MySQL edition optimized specifically for **Hostinger Shared Hosting, cPanel, and Subdomain deployments** (zero Node.js or npm runtime required on the server).

### A. Prerequisites on Hostinger
1. **PHP Version**: Select **PHP 8.1 or 8.2** in Hostinger hPanel -> Advanced -> PHP Configuration.
2. **Extensions**: Ensure `pdo_mysql`, `curl`, `json`, `mbstring` are enabled (default on Hostinger).
3. **MySQL Database**:
   - Go to **Databases** -> **MySQL Databases** in Hostinger hPanel.
   - Create a database (e.g. `u123456789_saranya_db`) and database user with password.
   - Note down: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_HOST` (usually `localhost`).

### B. Safe Database Migration (Zero Data Loss)
1. Open **phpMyAdmin** from Hostinger hPanel.
2. Select your database.
3. Click the **Import** tab and upload:
   ```
   php-app/database/migration_hostinger_safe.sql
   ```
   > **Note**: This safe migration uses `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE INTO`. Existing database records and tables will **never** be dropped or overwritten.

### C. File Upload & Subdomain Directory Structure
1. In Hostinger hPanel, create your subdomain (e.g. `saranya.yourdomain.com`).
   - By default, Hostinger creates the document root at `domains/yourdomain.com/public_html/saranya/` or `public_html/saranya/`.
2. Upload the contents of the `php-app/` directory into your subdomain folder:
   ```
   public_html/saranya/
   ├── backend/
   ├── database/
   ├── logs/
   ├── storage/
   ├── public/
   │   ├── index.html
   │   ├── css/
   │   └── js/
   ├── .htaccess
   └── .env           <-- Create this file on Hostinger!
   ```
3. Set file permissions in Hostinger File Manager:
   - Folders: `755`
   - Files: `644`
   - `logs/` and `storage/`: `755` (writeable)

### D. Configure Environment Variables (`.env`)
Create a `.env` file in the subdomain root (`public_html/saranya/.env`) using `.env.example` as a template:
```env
APP_ENV=production
APP_URL=https://saranya.yourdomain.com

DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_saranya_db
DB_USER=u123456789_saranya_user
DB_PASSWORD=your_hostinger_db_password

OWNER_NAME=Naga
OWNER_PHONE=+916382379565

AI_ASSISTANT_NAME=Arya
AI_LANGUAGE=Tamil
AI_VOICE_STYLE=Natural Chennai conversational Tamil

QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
ALLOW_HIGH_PRIORITY_IN_QUIET_HOURS=true

MOCK_MODE=false
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

N8N_WEBHOOK_SECRET=your_secure_n8n_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_whatsapp_verify_token
```

### E. Production Error Logging
- In production (`APP_ENV=production`), PHP errors are **hidden from user screens** for security (`display_errors = 0`) and automatically logged to `logs/error.log`.
- Direct web access to `.env`, `*.sql`, `*.log`, and `backend/config/` is strictly denied by the production `.htaccess` file.

### F. Production Webhook Endpoints for Integrations
- **n8n Inbound Webhook**: `https://saranya.yourdomain.com/webhooks/n8n.php` (Header: `x-n8n-secret`)
- **WhatsApp Webhook**: `https://saranya.yourdomain.com/webhooks/whatsapp.php`
- **Post-Call Telephony**: `https://saranya.yourdomain.com/webhooks/post-call.php`

