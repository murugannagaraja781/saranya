<?php
/**
 * Naga AI Assistant (Saranya) — Post-Call Telephony Webhook
 * Updates call status, transcripts, duration, and owner instructions after phone call finishes.
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed. Use POST.', 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!$body) {
    Response::error('Invalid JSON payload', 400);
}

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

$callId = $body['callId'] ?? null;
$providerCallId = $body['providerCallId'] ?? null;
$status = $body['status'] ?? 'completed';
$duration = (int)($body['duration'] ?? 0);
$transcript = $body['transcript'] ?? '';
$ownerInstruction = $body['ownerInstruction'] ?? '';

try {
    $stmt = $db->prepare("
        UPDATE calls 
        SET status = ?, 
            duration = ?, 
            transcript = COALESCE(NULLIF(?, ''), transcript), 
            owner_instruction = COALESCE(NULLIF(?, ''), owner_instruction),
            ended_at = NOW()
        WHERE id = ? OR provider_call_id = ?
    ");
    $stmt->execute([$status, $duration, $transcript, $ownerInstruction, $callId, $providerCallId]);

    // If instruction was recorded, update or insert task
    if (!empty($ownerInstruction)) {
        // Fetch call details
        $cStmt = $db->prepare("SELECT * FROM calls WHERE id = ? OR provider_call_id = ? LIMIT 1");
        $cStmt->execute([$callId, $providerCallId]);
        $call = $cStmt->fetch();

        if ($call) {
            $taskId = 'task-' . bin2hex(random_bytes(8));
            $tStmt = $db->prepare("
                INSERT INTO tasks (id, title, description, client_id, client_name, message_id, call_id, priority, status, due_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Tomorrow', 'owner_instruction')
            ");
            $tStmt->execute([
                $taskId,
                "Action for {$call['client_name']}",
                "Naga's Spoken Instruction: {$ownerInstruction}",
                $call['client_id'],
                $call['client_name'],
                $call['message_id'],
                $call['id'],
                $call['priority']
            ]);
        }
    }

    Response::json(['success' => true, 'updated' => true]);

} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
