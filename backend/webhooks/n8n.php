<?php
/**
 * Naga AI Assistant (Saranya) — n8n Webhook Ingestion Endpoint
 * URL: /backend/webhooks/n8n.php (or POST /api/webhooks/n8n/message)
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../services/MessageProcessor.php';

Response::handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$config = require __DIR__ . '/../config/config.php';
$secretHeader = $_SERVER['HTTP_X_N8N_SECRET'] ?? ($_GET['secret'] ?? null);

// Check secret if configured
if (!empty($config['n8n_secret']) && $secretHeader !== $config['n8n_secret']) {
    Response::error('Unauthorized. Invalid or missing x-n8n-secret header.', 401);
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);

if (!$body || empty($body['message'])) {
    Response::error('Bad Request: "message" payload field is required.', 400);
}

try {
    $processor = new MessageProcessor();

    $payload = [
        'channel' => ($body['channel'] ?? '') === 'whatsapp' ? 'whatsapp' : 'email',
        'clientName' => $body['clientName'] ?? ($body['senderName'] ?? 'Client'),
        'clientContact' => $body['clientContact'] ?? ($body['sender'] ?? ''),
        'company' => $body['company'] ?? '',
        'subject' => $body['subject'] ?? '',
        'message' => $body['message'],
        'sourceMessageId' => $body['sourceMessageId'] ?? ($body['id'] ?? null),
        'timestamp' => $body['timestamp'] ?? date('Y-m-d H:i:s'),
        'idempotencyKey' => $body['idempotencyKey'] ?? ($_SERVER['HTTP_X_IDEMPOTENCY_KEY'] ?? null)
    ];

    $result = $processor->processInbound($payload);
    Response::json($result, 200);

} catch (Exception $e) {
    error_log("n8n Webhook Error: " . $e->getMessage());
    Response::error('Internal Server Error: ' . $e->getMessage(), 500);
}
