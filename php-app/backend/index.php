<?php
/**
 * Naga AI Assistant (Saranya) — Backend API Router & Health Check
 */

require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/config/db.php';

Response::handleCors();

$config = require __DIR__ . '/config/config.php';
$db = Database::getConnection();

$dbStatus = $db ? 'Connected (MySQL)' : 'Disconnected (Check DB Settings)';

Response::json([
    'status' => 'ONLINE',
    'app' => 'Naga AI Assistant (Saranya) — PHP Backend',
    'version' => '1.0.0',
    'database' => $dbStatus,
    'mock_mode' => (bool)$config['mock_mode'],
    'assistant_name' => $config['assistant']['name'],
    'owner_name' => $config['owner']['name'],
    'routes' => [
        'GET  /backend/api/dashboard.php' => 'Dashboard metrics and overview',
        'GET  /backend/api/messages.php'  => 'Messages list and detail',
        'GET  /backend/api/calls.php'     => 'Call logs & trigger manual call',
        'GET  /backend/api/tasks.php'     => 'Action tasks list & updates',
        'GET  /backend/api/clients.php'   => 'Client directory',
        'GET  /backend/api/settings.php'  => 'System configurations',
        'POST /backend/api/simulate.php'  => 'Simulate inbound email/whatsapp',
        'POST /backend/webhooks/n8n.php'  => 'n8n inbound message webhook',
        'POST /backend/webhooks/whatsapp.php' => 'WhatsApp Cloud API webhook'
    ],
    'timestamp' => date('Y-m-d H:i:s')
]);
