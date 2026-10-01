<?php
/**
 * Naga AI Assistant (Saranya) — Message Processor Pipeline
 * Coordinates pre-filtering, Gemini AI analysis, MySQL storage, voice calling, and task creation.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/Cleaner.php';
require_once __DIR__ . '/../utils/PreFilter.php';
require_once __DIR__ . '/GeminiService.php';
require_once __DIR__ . '/VoiceProvider.php';
require_once __DIR__ . '/TelephonyService.php';

class MessageProcessor {
    private ?PDO $db;
    private array $config;
    private GeminiService $gemini;
    private VoiceProvider $voice;
    private TelephonyService $telephony;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->config = require __DIR__ . '/../config/config.php';
        $this->gemini = new GeminiService();
        $this->voice = new VoiceProvider();
        $this->telephony = new TelephonyService();
    }

    public function isQuietHour(): bool {
        $startStr = $this->config['quiet_hours']['start'] ?? '22:00';
        $endStr = $this->config['quiet_hours']['end'] ?? '07:00';

        $now = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
        $currentMins = (int)$now->format('H') * 60 + (int)$now->format('i');

        [$sH, $sM] = explode(':', $startStr);
        [$eH, $eM] = explode(':', $endStr);

        $startMins = (int)$sH * 60 + (int)$sM;
        $endMins = (int)$eH * 60 + (int)$eM;

        if ($startMins > $endMins) { // overnight
            return ($currentMins >= $startMins || $currentMins < $endMins);
        }
        return ($currentMins >= $startMins && $currentMins < $endMins);
    }

    public function processInbound(array $payload): array {
        if (!$this->db) {
            throw new Exception("Database connection unavailable. Please verify MySQL configuration.");
        }

        $idempotencyKey = $payload['idempotencyKey'] ?? ($payload['sourceMessageId'] ?? md5(($payload['clientContact'] ?? '') . substr($payload['message'] ?? '', 0, 40)));

        // 1. Check idempotency (skip duplicates)
        $stmt = $this->db->prepare("SELECT id FROM messages WHERE idempotency_key = ? LIMIT 1");
        $stmt->execute([$idempotencyKey]);
        $existing = $stmt->fetch();
        if ($existing) {
            $msgId = $existing['id'];
            $analysisStmt = $this->db->prepare("SELECT * FROM ai_analyses WHERE message_id = ? LIMIT 1");
            $analysisStmt->execute([$msgId]);
            $analysis = $analysisStmt->fetch();
            return [
                'success' => true,
                'isDuplicate' => true,
                'messageId' => $msgId,
                'should_call' => (bool)($analysis['should_call'] ?? false),
                'analysis' => $analysis
            ];
        }

        // 2. Upsert Client
        $clientName = trim($payload['clientName'] ?? 'Valued Client');
        $company = trim($payload['company'] ?? '');
        $contact = trim($payload['clientContact'] ?? '');
        $channel = ($payload['channel'] === 'whatsapp') ? 'whatsapp' : 'email';

        $clientId = $this->upsertClient($clientName, $company, $contact, $channel);

        // 3. Clean Message
        $cleanedMessage = Cleaner::cleanInboundMessage($channel, $payload['message'] ?? '');

        // 4. Save Message Record
        $messageId = 'msg-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        $msgStmt = $this->db->prepare("
            INSERT INTO messages (id, client_id, client_name, company, channel, subject, message, clean_message, received_at, status, source_message_id, idempotency_key, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?)
        ");
        $msgStmt->execute([
            $messageId,
            $clientId,
            $clientName,
            $company,
            $channel,
            $payload['subject'] ?? '',
            $payload['message'] ?? '',
            $cleanedMessage,
            $now,
            $payload['sourceMessageId'] ?? null,
            $idempotencyKey,
            json_encode($payload, JSON_UNESCAPED_UNICODE)
        ]);

        // 5. Evaluate Deterministic PreFilter
        $preFilter = PreFilter::evaluate($cleanedMessage, $payload['subject'] ?? '');
        $analysis = null;

        if ($preFilter['is_filtered']) {
            $analysis = [
                'should_call' => false,
                'client_name' => $clientName,
                'company' => $company,
                'client_contact' => $contact,
                'channel' => $channel,
                'priority' => $preFilter['priority'] ?? 'low',
                'summary' => $preFilter['summary'] ?? '',
                'next_step' => $preFilter['next_step'] ?? '',
                'deadline' => '',
                'reason' => $preFilter['reason'] ?? '',
                'category' => $preFilter['category'] ?? 'general',
                'model' => 'deterministic-prefilter'
            ];
        } else {
            // 6. Google Gemini AI Analysis
            $analysisResult = $this->gemini->analyzeMessage([
                'channel' => $channel,
                'clientName' => $clientName,
                'company' => $company,
                'clientContact' => $contact,
                'subject' => $payload['subject'] ?? '',
                'message' => $cleanedMessage
            ]);
            $analysis = $analysisResult;
            $analysis['model'] = $this->config['gemini']['model'] ?? 'gemini-1.5-flash';
        }

        // 7. Save AI Analysis in Database
        $analysisId = 'analysis-' . bin2hex(random_bytes(8));
        $analysisStmt = $this->db->prepare("
            INSERT INTO ai_analyses (id, message_id, should_call, client_name, company, client_contact, channel, priority, summary, next_step, deadline, reason, category, model, raw_response)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $analysisStmt->execute([
            $analysisId,
            $messageId,
            $analysis['should_call'] ? 1 : 0,
            $analysis['client_name'] ?? $clientName,
            $analysis['company'] ?? $company,
            $analysis['client_contact'] ?? $contact,
            $channel,
            $analysis['priority'] ?? 'normal',
            $analysis['summary'] ?? '',
            $analysis['next_step'] ?? '',
            $analysis['deadline'] ?? '',
            $analysis['reason'] ?? '',
            $analysis['category'] ?? 'general',
            $analysis['model'] ?? 'gemini-1.5-flash',
            json_encode($analysis, JSON_UNESCAPED_UNICODE)
        ]);

        // 8. Decide whether to trigger Phone Call
        $callTriggered = false;
        $callRecord = null;
        $taskRecord = null;
        $quietHoursBlocked = false;

        $shouldCall = (bool)$analysis['should_call'];

        if ($shouldCall) {
            $isQuiet = $this->isQuietHour();
            $allowHighInQuiet = (bool)($this->config['quiet_hours']['allow_high_priority'] ?? true);
            $isHighPriority = ($analysis['priority'] === 'high');

            if ($isQuiet && !($allowHighInQuiet && $isHighPriority)) {
                $quietHoursBlocked = true;
            } else {
                // Dispatch Call
                $ownerPhone = $this->config['owner']['phone'] ?? '+916382379565';
                $ownerName = $this->config['owner']['name'] ?? 'Naga';
                $callId = 'call-' . bin2hex(random_bytes(8));

                $voiceResult = $this->voice->triggerVoiceCall([
                    'callId' => $callId,
                    'ownerName' => $ownerName,
                    'clientName' => $clientName,
                    'channel' => $channel,
                    'summary' => $analysis['summary'],
                    'nextStep' => $analysis['next_step'] ?? '',
                    'priority' => $analysis['priority'],
                    'recipientPhone' => $ownerPhone,
                    'deadline' => $analysis['deadline'] ?? ''
                ]);

                // Insert into calls table
                $callStmt = $this->db->prepare("
                    INSERT INTO calls (id, message_id, client_id, client_name, channel, phone_number, provider, provider_call_id, status, priority, reason, summary, next_step, transcript, owner_instruction, duration, started_at, ended_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $startedAt = date('Y-m-d H:i:s');
                $endedAt = date('Y-m-d H:i:s', strtotime("+{$voiceResult['duration']} seconds"));

                $callStmt->execute([
                    $callId,
                    $messageId,
                    $clientId,
                    $clientName,
                    $channel,
                    $ownerPhone,
                    $voiceResult['provider'] ?? 'mock',
                    $voiceResult['provider_call_id'],
                    $voiceResult['status'] ?? 'completed',
                    $analysis['priority'],
                    $analysis['reason'],
                    $analysis['summary'],
                    $analysis['next_step'] ?? '',
                    $voiceResult['transcript'] ?? null,
                    $voiceResult['owner_instruction'] ?? null,
                    $voiceResult['duration'] ?? 0,
                    $startedAt,
                    $endedAt
                ]);

                $callTriggered = true;
                $callRecord = [
                    'id' => $callId,
                    'status' => $voiceResult['status'],
                    'transcript' => $voiceResult['transcript'] ?? null,
                    'owner_instruction' => $voiceResult['owner_instruction'] ?? null
                ];

                // Auto-create task if owner instruction captured
                if (!empty($voiceResult['owner_instruction'])) {
                    $taskId = 'task-' . bin2hex(random_bytes(8));
                    $taskTitle = "Confirm action for {$clientName}";
                    $taskDesc = "Instruction from {$ownerName}: " . $voiceResult['owner_instruction'];

                    $taskStmt = $this->db->prepare("
                        INSERT INTO tasks (id, title, description, client_id, client_name, company, message_id, call_id, priority, status, due_date, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'owner_instruction')
                    ");
                    $taskStmt->execute([
                        $taskId,
                        $taskTitle,
                        $taskDesc,
                        $clientId,
                        $clientName,
                        $company,
                        $messageId,
                        $callId,
                        $analysis['priority'],
                        $analysis['deadline'] ?? 'Tomorrow'
                    ]);
                    $taskRecord = ['id' => $taskId, 'title' => $taskTitle];
                }

                // Increment client total calls
                $this->db->prepare("UPDATE clients SET total_calls = total_calls + 1 WHERE id = ?")->execute([$clientId]);
            }
        }

        // 9. Update Message Status
        $finalStatus = $callTriggered ? 'called' : ($shouldCall ? 'pending' : 'analyzed');
        $this->db->prepare("UPDATE messages SET status = ?, processed_at = NOW() WHERE id = ?")->execute([$finalStatus, $messageId]);

        // Increment client total messages
        $this->db->prepare("UPDATE clients SET total_messages = total_messages + 1, updated_at = NOW() WHERE id = ?")->execute([$clientId]);

        // 10. Audit Log
        $auditId = 'audit-' . bin2hex(random_bytes(8));
        $this->db->prepare("
            INSERT INTO audit_logs (id, service, event, status, details)
            VALUES (?, 'SaranyaPHP', 'message_processed', 'success', ?)
        ")->execute([
            $auditId,
            json_encode([
                'messageId' => $messageId,
                'channel' => $channel,
                'client' => $clientName,
                'callTriggered' => $callTriggered,
                'quietHoursBlocked' => $quietHoursBlocked
            ], JSON_UNESCAPED_UNICODE)
        ]);

        return [
            'success' => true,
            'messageId' => $messageId,
            'should_call' => $shouldCall,
            'priority' => $analysis['priority'],
            'callTriggered' => $callTriggered,
            'quietHoursBlocked' => $quietHoursBlocked,
            'call' => $callRecord,
            'task' => $taskRecord,
            'analysis' => $analysis
        ];
    }

    private function upsertClient(string $name, string $company, string $contact, string $channel): string {
        $email = ($channel === 'email') ? $contact : null;
        $phone = ($channel === 'whatsapp') ? $contact : null;

        // Try to find existing client by phone or email or name
        $stmt = $this->db->prepare("
            SELECT id FROM clients 
            WHERE (email IS NOT NULL AND email = ?) 
               OR (phone IS NOT NULL AND phone = ?) 
               OR (name = ?)
            LIMIT 1
        ");
        $stmt->execute([$email, $phone, $name]);
        $existing = $stmt->fetch();

        if ($existing) {
            $clientId = $existing['id'];
            $update = $this->db->prepare("
                UPDATE clients 
                SET company = COALESCE(NULLIF(?, ''), company),
                    email = COALESCE(NULLIF(?, ''), email),
                    phone = COALESCE(NULLIF(?, ''), phone),
                    whatsapp = COALESCE(NULLIF(?, ''), whatsapp),
                    updated_at = NOW()
                WHERE id = ?
            ");
            $update->execute([$company, $email, $phone, $phone, $clientId]);
            return $clientId;
        }

        $clientId = 'client-' . bin2hex(random_bytes(8));
        $insert = $this->db->prepare("
            INSERT INTO clients (id, name, company, email, phone, whatsapp, total_messages, total_calls, notes)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'Auto-created from inbound message')
        ");
        $insert->execute([$clientId, $name, $company, $email, $phone, $phone]);
        return $clientId;
    }
}
