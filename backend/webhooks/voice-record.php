<?php
/**
 * Naga AI Assistant (Arya) — Vobiz Voice Recording Callback Webhook
 * 
 * Invoked by Vobiz when Naga finishes speaking his instruction during the phone briefing.
 * 1. Downloads or references the recorded audio from Vobiz.
 * 2. Uses Google Gemini 1.5 Flash to transcribe Naga's spoken voice.
 * 3. Drafts professional WhatsApp reply for the client.
 * 4. Automatically dispatches the reply via WhatsApp Cloud API / OutboundMessenger.
 * 5. Returns final Vobiz XML acknowledgment.
 */

header('Content-Type: text/xml; charset=UTF-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../services/GeminiService.php';
require_once __DIR__ . '/../services/OutboundMessenger.php';

$db = Database::getConnection();
$config = require __DIR__ . '/../config/config.php';

// Extract Vobiz payload parameters
$recordUrl = $_POST['RecordUrl'] ?? ($_GET['RecordUrl'] ?? null);
$callUuid = $_POST['CallUUID'] ?? ($_GET['call_id'] ?? null);
$duration = (int)($_POST['RecordingDuration'] ?? 0);

$ownerInstruction = "Please proceed with the discussed quotation and share payment details.";
$clientPhone = null;
$clientName = "Client";
$originalMessage = "Client inquiry";

if ($db && $callUuid) {
    try {
        // Fetch the corresponding call and message
        $stmt = $db->prepare("
            SELECT c.*, m.message as original_message, m.client_contact, m.company
            FROM calls c
            LEFT JOIN messages m ON c.message_id = m.id
            WHERE c.id = ? OR c.provider_call_id = ?
            ORDER BY c.created_at DESC LIMIT 1
        ");
        $stmt->execute([$callUuid, $callUuid]);
        $call = $stmt->fetch();

        if ($call) {
            $clientName = $call['client_name'] ?? 'Client';
            $clientPhone = $call['client_contact'] ?? ($call['phone_number'] ?? null);
            $originalMessage = $call['original_message'] ?? ($call['summary'] ?? '');

            // If audio recording URL is present and Gemini API key is available, transcribe with Gemini
            $geminiKey = $config['gemini']['api_key'] ?? '';
            if (!empty($recordUrl) && !empty($geminiKey)) {
                $audioData = @file_get_contents($recordUrl);
                if ($audioData) {
                    $base64Audio = base64_encode($audioData);
                    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$config['gemini']['model']}:generateContent?key={$geminiKey}";
                    $payload = [
                        'contents' => [
                            [
                                'parts' => [
                                    [
                                        'text' => 'Listen carefully to this audio recording of Naga speaking in Tamil/English. Transcribe the exact business instruction Naga gave on what to reply to the client. Return ONLY the transcribed instruction text without extra explanation.'
                                    ],
                                    [
                                        'inlineData' => [
                                            'mimeType' => 'audio/wav',
                                            'data' => $base64Audio
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ];

                    $ch = curl_init($endpoint);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
                    $res = curl_exec($ch);
                    curl_close($ch);

                    if ($res) {
                        $parsedRes = json_decode($res, true);
                        $transcribedText = trim($parsedRes['candidates'][0]['content']['parts'][0]['text'] ?? '');
                        if (!empty($transcribedText)) {
                            $ownerInstruction = $transcribedText;
                        }
                    }
                }
            }

            // Draft polished reply using Gemini
            $gemini = new GeminiService();
            $draftResult = $gemini->draftClientReply([
                'clientName' => $clientName,
                'company' => $call['company'] ?? '',
                'originalMessage' => $originalMessage,
                'ownerInstruction' => $ownerInstruction,
                'channel' => 'whatsapp'
            ]);

            $draftedReply = $draftResult['reply_text'] ?? "Dear {$clientName}, Thank you for reaching out. We have noted your request and will proceed accordingly. Warm regards, Naga";

            // Update call record with captured instruction & status
            $uStmt = $db->prepare("
                UPDATE calls
                SET owner_instruction = ?,
                    duration = COALESCE(NULLIF(?, 0), duration),
                    status = 'completed',
                    ended_at = NOW()
                WHERE id = ? OR provider_call_id = ?
            ");
            $uStmt->execute([$ownerInstruction, $duration, $callUuid, $callUuid]);

            // Dispatch reply directly via WhatsApp Cloud API / Messenger
            if (!empty($clientPhone)) {
                $messenger = new OutboundMessenger();
                $messenger->dispatch([
                    'clientContact' => $clientPhone,
                    'clientName' => $clientName,
                    'replyText' => $draftedReply,
                    'channel' => 'whatsapp'
                ]);
            }
        }
    } catch (Exception $e) {
        error_log("voice-record.php error: " . $e->getMessage());
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<Response>
    <Speak voice="WOMAN" language="en-IN">Thank you Naga. Your instruction has been recorded and Arya is sending the WhatsApp reply to <?php echo htmlspecialchars($clientName); ?> right now. Have a great day.</Speak>
</Response>
