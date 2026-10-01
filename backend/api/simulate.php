<?php
/**
 * Naga AI Assistant (Saranya) — Message Simulation API
 * Allows testing incoming Gmail or WhatsApp messages directly from the dashboard.
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../services/MessageProcessor.php';

Response::handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!$body || empty($body['message'])) {
    Response::error('Message text is required for simulation.', 400);
}

try {
    $processor = new MessageProcessor();

    $payload = [
        'channel' => ($body['channel'] ?? '') === 'whatsapp' ? 'whatsapp' : 'email',
        'clientName' => $body['clientName'] ?? 'Ramesh Kumar',
        'company' => $body['company'] ?? 'ABC Traders',
        'clientContact' => $body['clientContact'] ?? '+919840123456',
        'subject' => $body['subject'] ?? '',
        'message' => $body['message'],
        'sourceMessageId' => 'sim-' . bin2hex(random_bytes(6)),
        'idempotencyKey' => 'sim-' . uniqid()
    ];

    $result = $processor->processInbound($payload);
    Response::json($result, 200);

} catch (Throwable $e) {
    error_log("Simulation Error: " . $e->getMessage());
    Response::error($e->getMessage(), 500);
}
