# Naga AI Assistant (Saranya) — PHP & MySQL Edition

Welcome to the **PHP + MySQL (Backend)** and **HTML5 + CSS3 + Vanilla JS (Frontend)** edition of **Naga AI Assistant (Saranya)**.

This version is completely standalone, lightweight, and does not require Node.js, npm, or Vite build steps. It is 100% compatible with any standard PHP hosting (cPanel, Hostinger, GoDaddy, VPS, XAMPP, or MAMP).

---

## 📁 Project Structure

```
php-app/
├── database/
│   └── schema.sql            # Complete MySQL tables, indexes, and initial seed data
├── backend/
│   ├── config/
│   │   ├── config.php        # App settings & environment reader
│   │   └── db.php            # PDO MySQL connection wrapper
│   ├── utils/
│   │   ├── Cleaner.php       # Email signature stripping & prompt injection defense
│   │   ├── PreFilter.php     # Regex pre-filter (fast OTP/spam/newsletter skip)
│   │   └── Response.php      # Standard JSON response & CORS helper
│   ├── services/
│   │   ├── GeminiService.php # Google Gemini 1.5 Flash REST API + Chennai Tamil briefing
│   │   ├── TelephonyService.php # Vobiz outbound telephony adapter + mock provider
│   │   ├── VoiceProvider.php # SnapServe voice agent adapter + mock dialogues
│   │   └── MessageProcessor.php # Pipeline: Filter -> Gemini -> DB -> Call -> Task
│   ├── webhooks/
│   │   ├── n8n.php           # Primary n8n Webhook endpoint
│   │   ├── whatsapp.php      # WhatsApp Cloud API (GET challenge + POST messages)
│   │   └── post-call.php     # Post-call transcription & instruction webhook
│   ├── api/
│   │   ├── dashboard.php     # Aggregated KPI statistics & recent briefings
│   │   ├── messages.php      # Inbox list & message inspection
│   │   ├── calls.php         # Call logs & manual call trigger
│   │   ├── tasks.php         # Task board & status toggling
│   │   ├── clients.php       # Client directory
│   │   ├── settings.php      # System configuration
│   │   └── simulate.php      # Browser test simulation endpoint
│   └── index.php             # API health check router
├── public/                   # Frontend (Pure HTML5, CSS3, Vanilla JS)
│   ├── index.html            # Responsive Executive Dashboard
│   ├── css/style.css         # Modern styling, responsive layout, audio player wave
│   └── js/app.js             # Live auto-refresh, modal controls, API integration
└── docker-compose.yml        # (Optional) 1-click local Docker setup
```

---

## 🚀 Setup & Installation

### Step 1: Create MySQL Database
1. Open **phpMyAdmin** (or your MySQL CLI).
2. Create a new database named `saranya_db`:
   ```sql
   CREATE DATABASE saranya_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the schema file:
   ```bash
   mysql -u root -p saranya_db < php-app/database/schema.sql
   ```
   *(Or import `php-app/database/schema.sql` directly inside phpMyAdmin's **Import** tab)*.

---

### Step 2: Configure Database Credentials
Edit `php-app/backend/config/config.php` (or add a `.env` file):
```php
'db' => [
    'host' => '127.0.0.1',
    'port' => '3306',
    'database' => 'saranya_db',
    'username' => 'root',     // Your MySQL username
    'password' => '',         // Your MySQL password
    'charset' => 'utf8mb4'
],
```

---

### Step 3: Run the Application

#### Option A: Using XAMPP / MAMP
1. Copy the `php-app/` folder into your web root:
   - XAMPP: `C:/xampp/htdocs/saranya/`
   - MAMP: `/Applications/MAMP/htdocs/saranya/`
2. Open your browser:
   ```
   http://localhost/saranya/public/
   ```

#### Option B: Using PHP Built-in Server (Local Terminal)
From the project directory:
```bash
php -S localhost:8000 -t php-app
```
Then visit:
```
http://localhost:8000/public/
```

#### Option C: Deploying to cPanel / Shared Hosting
1. Upload the files inside `php-app/public/` to your `public_html/`.
2. Upload the `backend/` and `database/` folders to your hosting directory.
3. Import `database/schema.sql` in cPanel **phpMyAdmin**.
4. Update `backend/config/config.php` with your cPanel database username and password.

---

## 🔗 Webhook Endpoints for n8n & WhatsApp

| Service | Webhook URL | Method | Notes |
| :--- | :--- | :--- | :--- |
| **n8n Automation** | `http://your-domain.com/backend/webhooks/n8n.php` | `POST` | Header: `x-n8n-secret: dev_n8n_secret_token_12345` |
| **WhatsApp Business** | `http://your-domain.com/backend/webhooks/whatsapp.php` | `GET / POST` | Verify Token: `dev_whatsapp_verify_token_12345` |
| **Post-Call Telephony** | `http://your-domain.com/backend/webhooks/post-call.php` | `POST` | Ingests duration, transcript, and owner instruction |

---

## 🧪 Testing the System from Dashboard
1. Open the Dashboard in your browser (`http://localhost/saranya/public/`).
2. Click the blue **"Simulate Message"** button in the top right.
3. Choose any test scenario:
   - **Quotation & Installments**: Triggers Gemini AI, produces spoken Chennai Tamil briefing, places outbound call to Naga, and creates an action task!
   - **Delivery Confirmation**: Generates delivery schedule check in Tamil.
   - **OTP Code / Thanks**: Automatically filtered by the regex pre-filter to save Gemini API costs.
4. Click **"Process & Dispatch Call"** to see live results and listen to the simulated call recording dialogue!
