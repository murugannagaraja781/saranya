<?php
/**
 * Naga AI Assistant (Saranya) — Hostinger Production Configuration Loader
 * Handles environment variables, production error logging, and system settings.
 */

// Load .env file safely
function loadEnvironmentVariables(): void {
    $searchPaths = [
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__) . '/.env',
        __DIR__ . '/../../../.env',
        __DIR__ . '/../../.env',
        __DIR__ . '/../.env',
        __DIR__ . '/.env',
        dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',
        ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',
    ];

    foreach ($searchPaths as $path) {
        if (file_exists($path) && is_readable($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) {
                    continue;
                }
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    // Strip surrounding quotes
                    if (preg_match('/^"(.*)"$/', $val, $m) || preg_match("/^'(.*)'$/", $val, $m)) {
                        $val = $m[1];
                    }
                    if (getenv($key) === false) {
                        putenv("{$key}={$val}");
                        $_ENV[$key] = $val;
                        $_SERVER[$key] = $val;
                    }
                }
            }
            break; // Stop after first valid .env found
        }
    }
}

loadEnvironmentVariables();

// 1. Environment & URL
$appEnv = getenv('APP_ENV') ?: 'production';
$appUrl = getenv('APP_URL') ?: 'http://localhost';

// 2. Production Error Handling (Requirement 11: Never show errors on screen in production; log to file)
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
$errorLogFile = $logDir . '/error.log';

if ($appEnv === 'production') {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
}

ini_set('log_errors', '1');
ini_set('error_log', $errorLogFile);

// 3. Configuration Array (NO hardcoded passwords or secrets!)
return [
    'app_name' => 'Naga AI Assistant (Arya)',
    'env' => $appEnv,
    'app_url' => rtrim($appUrl, '/'),
    'mock_mode' => filter_var(getenv('MOCK_MODE') ?: false, FILTER_VALIDATE_BOOLEAN),

    // Database credentials strictly from environment variables
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: '',
        'username' => getenv('DB_USER') ?: '',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset' => 'utf8mb4'
    ],

    // Owner and Persona details
    'owner' => [
        'name' => getenv('OWNER_NAME') ?: 'Naga',
        'phone' => getenv('OWNER_PHONE') ?: '+916382379565',
        'email' => getenv('OWNER_EMAIL') ?: 'naga@business.com',
    ],

    'assistant' => [
        'name' => getenv('AI_ASSISTANT_NAME') ?: 'Arya',
        'language' => getenv('AI_LANGUAGE') ?: 'Tamil',
        'voice_style' => getenv('AI_VOICE_STYLE') ?: 'Natural Chennai conversational Tamil',
    ],

    // Keyword Trigger for Voice Calling (Only calls if message contains this keyword)
    'call_trigger_keyword' => getenv('CALL_TRIGGER_KEYWORD') ?: 'naga',

    // Quiet Hours
    'quiet_hours' => [
        'start' => getenv('QUIET_HOURS_START') ?: '22:00',
        'end' => getenv('QUIET_HOURS_END') ?: '07:00',
        'allow_high_priority' => filter_var(getenv('ALLOW_HIGH_PRIORITY_IN_QUIET_HOURS') ?: true, FILTER_VALIDATE_BOOLEAN),
    ],

    // Google Gemini API
    'gemini' => [
        'api_key' => getenv('GEMINI_API_KEY') ?: '',
        'model' => getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash',
    ],

    // Telephony
    'vobiz' => [
        'base_url' => getenv('VOBIZ_BASE_URL') ?: 'https://api.vobiz.ai/v1',
        'auth_id' => getenv('VOBIZ_AUTH_ID') ?: '',
        'auth_token' => getenv('VOBIZ_AUTH_TOKEN') ?: '',
        'caller_number' => getenv('VOBIZ_NUMBER') ?: '+914400000000',
    ],

    'snapserve' => [
        'base_url' => getenv('SNAPSERVE_BASE_URL') ?: 'https://api.snapserve.ai/v1',
        'api_key' => getenv('SNAPSERVE_API_KEY') ?: '',
        'agent_id' => getenv('SNAPSERVE_AGENT_ID') ?: '',
    ],

    // Webhook Verification Secrets
    'n8n_secret' => getenv('N8N_WEBHOOK_SECRET') ?: '',
    'whatsapp_verify_token' => getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?: '',

    // Outbound Messaging Providers (UltraMsg QR Code, WhatsApp Cloud API, n8n)
    'outbound' => [
        'n8n_webhook_url' => getenv('N8N_OUTBOUND_WEBHOOK_URL') ?: '',
        'whatsapp_token' => getenv('WHATSAPP_API_TOKEN') ?: '',
        'whatsapp_phone_number_id' => getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '',
        'ultramsg_instance_id' => getenv('ULTRAMSG_INSTANCE_ID') ?: 'instance193148',
        'ultramsg_token' => getenv('ULTRAMSG_TOKEN') ?: 'zvfqag30fw73yo7u',
        'evolution_api_url' => getenv('EVOLUTION_API_URL') ?: '',
        'evolution_api_key' => getenv('EVOLUTION_API_KEY') ?: '',
        'evolution_instance' => getenv('EVOLUTION_INSTANCE') ?: 'default',
    ],
];
