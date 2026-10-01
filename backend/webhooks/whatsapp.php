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
        // Extract WhatsApp Cloud API message structure
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

        // UltraMsg payload format (event_type: message_received)
        if (isset($body['data']['body'])) {
            $eventType = $body['event_type'] ?? 'message_received';
            if ($eventType !== 'message_received') {
                Response::json(['status' => 'ignored', 'reason' => "Ignored event: {$eventType}"]);
            }
            if (!empty($body['data']['fromMe'])) {
                Response::json(['status' => 'ignored', 'reason' => 'Self-sent message']);
            }
            $senderRaw = $body['data']['from'] ?? '';
            if (strpos($senderRaw, 'broadcast') !== false) {
                Response::json(['status' => 'ignored', 'reason' => 'Broadcast status update ignored']);
            }
            $sender = preg_replace('/[^0-9]/', '', explode('@', $senderRaw)[0]);
            $senderName = $body['data']['pushname'] ?? 'WhatsApp Client';
            $text = $body['data']['body'] ?? '';

            $processor = new MessageProcessor();
            $result = $processor->processInbound([
                'channel' => 'whatsapp',
                'clientName' => $senderName,
                'clientContact' => "+{$sender}",
                'message' => $text,
                'sourceMessageId' => $body['data']['id'] ?? null,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            Response::json(['status' => 'success', 'result' => $result]);
        }

        // Evolution API / Baileys payload format
        if (isset($body['data']['message'])) {
            $key = $body['data']['key'] ?? [];
            if (!empty($key['fromMe'])) {
                Response::json(['status' => 'ignored', 'reason' => 'Self-sent message']);
            }
            $senderRaw = $key['remoteJid'] ?? '';
            $sender = preg_replace('/[^0-9]/', '', explode('@', $senderRaw)[0]);
            $senderName = $body['data']['pushName'] ?? 'WhatsApp Client';
            $text = $body['data']['message']['conversation'] ?? ($body['data']['message']['extendedTextMessage']['text'] ?? '');

            if (!empty($text)) {
                $processor = new MessageProcessor();
                $result = $processor->processInbound([
                    'channel' => 'whatsapp',
                    'clientName' => $senderName,
                    'clientContact' => "+{$sender}",
                    'message' => $text,
                    'sourceMessageId' => $key['id'] ?? null,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                Response::json(['status' => 'success', 'result' => $result]);
            }
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

    } catch (Throwable $e) {
        error_log("WhatsApp Webhook Error: " . $e->getMessage());
        Response::error($e->getMessage(), 500);
    }
}
