<?php
/**
 * Naga AI Assistant (Saranya) — WhatsApp Cloud API Webhook
 * Supports GET (hub challenge verification) and POST (incoming WhatsApp messages)
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../services/MessageProcessor.php';

Response::handleCors();

$config = require __DIR__ . '/../config/config.php';

// 1. GET Challenge Verification
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? ($_GET['hub.mode'] ?? null);
    $token = $_GET['hub_verify_token'] ?? ($_GET['hub.verify_token'] ?? null);
    $challenge = $_GET['hub_challenge'] ?? ($_GET['hub.challenge'] ?? null);

    if ($mode === 'subscribe' && $token === $config['whatsapp_verify_token']) {
        header('Content-Type: text/plain');
        http_response_code(200);
        echo $challenge;
        exit;
    }

    Response::error('Forbidden: Invalid verification token', 403);
}

// 2. POST Message Ingestion
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    try {
        // Extract WhatsApp message structure
        $entry = $body['entry'][0]['changes'][0]['value'] ?? null;
        if ($entry && isset($entry['messages'][0])) {
            $msg = $entry['messages'][0];
            $sender = $msg['from'] ?? '';
            $senderName = $entry['contacts'][0]['profile']['name'] ?? 'WhatsApp Client';
            $text = $msg['text']['body'] ?? ($msg['caption'] ?? '[Non-text message]');

            $processor = new MessageProcessor();
            $result = $processor->processInbound([
                'channel' => 'whatsapp',
                'clientName' => $senderName,
                'clientContact' => "+{$sender}",
                'message' => $text,
                'sourceMessageId' => $msg['id'] ?? null,
                'timestamp' => date('Y-m-d H:i:s', $msg['timestamp'] ?? time())
            ]);

            Response::json(['status' => 'success', 'result' => $result]);
        }

        // Direct payload format fallback
        if (isset($body['message'])) {
            $processor = new MessageProcessor();
            $result = $processor->processInbound([
                'channel' => 'whatsapp',
                'clientName' => $body['clientName'] ?? 'WhatsApp User',
                'clientContact' => $body['clientContact'] ?? '',
                'message' => $body['message'],
                'sourceMessageId' => $body['sourceMessageId'] ?? null
            ]);
            Response::json(['status' => 'success', 'result' => $result]);
        }

        Response::json(['status' => 'ignored', 'reason' => 'No processable message found']);

    } catch (Exception $e) {
        error_log("WhatsApp Webhook Error: " . $e->getMessage());
        Response::error($e->getMessage(), 500);
    }
}
