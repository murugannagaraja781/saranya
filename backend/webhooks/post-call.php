<?php
/**
 * Naga AI Assistant (Saranya) — Post-Call Telephony Webhook
 * Updates call status, transcripts, duration, and owner instructions after phone call finishes.
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../services/GeminiService.php';
require_once __DIR__ . '/../services/OutboundMessenger.php';

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

    // If instruction was recorded, draft professional reply via Gemini and dispatch
    $draftedReply = null;
    $dispatchResult = null;

    if (!empty($ownerInstruction)) {
        // Fetch call details
        $cStmt = $db->prepare("SELECT * FROM calls WHERE id = ? OR provider_call_id = ? LIMIT 1");
        $cStmt->execute([$callId, $providerCallId]);
        $call = $cStmt->fetch();

        if ($call) {
            // Retrieve original client message and contact details
            $originalMessageText = '';
            $clientContact = '';
            $company = '';
            $channel = $call['channel'] ?? 'whatsapp';

            if (!empty($call['message_id'])) {
                $mStmt = $db->prepare("SELECT message, subject, channel, client_contact FROM messages WHERE id = ? LIMIT 1");
                $mStmt->execute([$call['message_id']]);
                $msgRecord = $mStmt->fetch();
                if ($msgRecord) {
                    $originalMessageText = $msgRecord['message'] ?? '';
                    $clientContact = $msgRecord['client_contact'] ?? '';
                    $channel = $msgRecord['channel'] ?? $channel;
                }
            }

            if (empty($clientContact) && !empty($call['client_id'])) {
                $clStmt = $db->prepare("SELECT phone, whatsapp, company FROM clients WHERE id = ? LIMIT 1");
                $clStmt->execute([$call['client_id']]);
                $clientRecord = $clStmt->fetch();
                if ($clientRecord) {
                    $clientContact = $clientRecord['whatsapp'] ?: ($clientRecord['phone'] ?: '');
                    $company = $clientRecord['company'] ?: '';
                }
            }

            // 1. Ask Gemini to craft a professional, polite WhatsApp/Email response based on Naga's instruction
            $gemini = new GeminiService();
            $replyDraft = $gemini->draftClientReply([
                'clientName' => $call['client_name'],
                'company' => $company,
                'originalMessage' => $originalMessageText,
                'ownerInstruction' => $ownerInstruction,
                'channel' => $channel
            ]);
            $draftedReply = $replyDraft['reply_text'] ?? '';

            // 2. Dispatch the message back to client via WhatsApp / n8n
            $messenger = new OutboundMessenger();
            $dispatchResult = $messenger->dispatchReply([
                'to' => $clientContact,
                'clientName' => $call['client_name'],
                'channel' => $channel,
                'replyText' => $draftedReply,
                'ownerInstruction' => $ownerInstruction,
                'originalMessageId' => $call['message_id'] ?? null
            ]);

            // 3. Save as action task in Dashboard with full visibility
            $taskId = 'task-' . bin2hex(random_bytes(8));
            $tStmt = $db->prepare("
                INSERT INTO tasks (id, title, description, client_id, client_name, company, message_id, call_id, priority, status, due_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'Today', 'owner_instruction')
            ");
            $taskDesc = "Naga's Voice Instruction: \"{$ownerInstruction}\"\n\n" .
                        "Gemini Professional Reply:\n{$draftedReply}\n\n" .
                        "Dispatch Status: " . ($dispatchResult['provider'] ?? 'Sent') . " to {$clientContact}";

            $tStmt->execute([
                $taskId,
                "Auto Reply to {$call['client_name']}",
                $taskDesc,
                $call['client_id'],
                $call['client_name'],
                $company,
                $call['message_id'],
                $call['id'],
                $call['priority'] ?? 'high'
            ]);
        }
    }

    Response::json([
        'success' => true,
        'updated' => true,
        'drafted_reply' => $draftedReply,
        'dispatch' => $dispatchResult
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
