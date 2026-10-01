<?php
/**
 * Naga AI Assistant (Saranya) — Voice Calls REST API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../services/VoiceProvider.php';

Response::handleCors();

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

// 1. POST: Trigger Manual Outbound Call
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    $clientName = $body['clientName'] ?? 'Important Client';
    $summary = $body['summary'] ?? 'Manual test voice briefing from dashboard.';
    $priority = $body['priority'] ?? 'high';

    $config = require __DIR__ . '/../config/config.php';
    $voice = new VoiceProvider();

    $callId = 'call-' . bin2hex(random_bytes(8));
    $ownerPhone = $config['owner']['phone'] ?? '+916382379565';
    $ownerName = $config['owner']['name'] ?? 'Naga';

    $voiceResult = $voice->triggerVoiceCall([
        'callId' => $callId,
        'ownerName' => $ownerName,
        'clientName' => $clientName,
        'channel' => 'whatsapp',
        'summary' => $summary,
        'nextStep' => 'Follow up on manual briefing',
        'priority' => $priority,
        'recipientPhone' => $ownerPhone
    ]);

    $stmt = $db->prepare("
        INSERT INTO calls (id, client_name, channel, phone_number, provider, provider_call_id, status, priority, reason, summary, next_step, transcript, owner_instruction, duration, started_at, ended_at)
        VALUES (?, ?, 'whatsapp', ?, ?, ?, ?, ?, 'Manual Dashboard Trigger', ?, 'Follow up', ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([
        $callId,
        $clientName,
        $ownerPhone,
        $voiceResult['provider'] ?? 'mock',
        $voiceResult['provider_call_id'],
        $voiceResult['status'] ?? 'completed',
        $priority,
        $summary,
        $voiceResult['transcript'] ?? null,
        $voiceResult['owner_instruction'] ?? null,
        $voiceResult['duration'] ?? 40
    ]);

    Response::json([
        'success' => true,
        'callId' => $callId,
        'call' => $voiceResult
    ]);
}

// 2. GET: List Calls
$id = $_GET['id'] ?? null;
if ($id) {
    $stmt = $db->prepare("SELECT * FROM calls WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $call = $stmt->fetch();
    if (!$call) {
        Response::error('Call record not found', 404);
    }
    Response::json(['success' => true, 'call' => $call]);
}

$stmt = $db->query("SELECT * FROM calls ORDER BY created_at DESC LIMIT 50");
$calls = $stmt->fetchAll();

Response::json([
    'success' => true,
    'total' => count($calls),
    'calls' => $calls
]);
