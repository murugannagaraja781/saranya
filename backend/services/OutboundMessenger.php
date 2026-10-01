<?php
/**
 * Naga AI Assistant (Saranya) — Outbound Messaging Service
 * Dispatches Gemini-drafted replies back to clients via WhatsApp Cloud API or n8n Webhook.
 */

require_once __DIR__ . '/../config/db.php';

class OutboundMessenger {
    private array $config;
    private ?PDO $db;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/config.php';
        $this->db = Database::getConnection();
    }

    /**
     * Dispatches a drafted response to the client
     *
     * @param array $params [to, clientName, channel, replyText, originalMessageId, ownerInstruction]
     * @return array [success => bool, provider => string, messageId => string]
     */
    public function dispatchReply(array $params): array {
        $to = $params['to'] ?? '';
        $clientName = $params['clientName'] ?? 'Client';
        $channel = $params['channel'] ?? 'whatsapp';
        $replyText = $params['replyText'] ?? '';
        $ownerInstruction = $params['ownerInstruction'] ?? '';
        $messageId = $params['originalMessageId'] ?? null;

        $n8nUrl = $this->config['outbound']['n8n_webhook_url'] ?? (getenv('N8N_OUTBOUND_WEBHOOK_URL') ?: getenv('N8N_WEBHOOK_URL') ?: '');
        $whatsappToken = $this->config['outbound']['whatsapp_token'] ?? (getenv('WHATSAPP_API_TOKEN') ?: '');
        $whatsappPhoneId = $this->config['outbound']['whatsapp_phone_number_id'] ?? (getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '');
        $ultraMsgInstance = getenv('ULTRAMSG_INSTANCE_ID') ?: ($this->config['outbound']['ultramsg_instance_id'] ?? '');
        $ultraMsgToken = getenv('ULTRAMSG_TOKEN') ?: ($this->config['outbound']['ultramsg_token'] ?? '');
        $evolutionUrl = getenv('EVOLUTION_API_URL') ?: ($this->config['outbound']['evolution_api_url'] ?? '');
        $evolutionKey = getenv('EVOLUTION_API_KEY') ?: ($this->config['outbound']['evolution_api_key'] ?? '');
        $evolutionInstance = getenv('EVOLUTION_INSTANCE') ?: ($this->config['outbound']['evolution_instance'] ?? 'default');
        $mockMode = (bool)($this->config['mock_mode'] ?? false);

        // 1. If WhatsApp Cloud API is directly configured and channel is whatsapp
        if (!$mockMode && !empty($whatsappToken) && !empty($whatsappPhoneId) && $channel === 'whatsapp') {
            $result = $this->sendViaWhatsAppCloudApi($whatsappPhoneId, $whatsappToken, $to, $replyText);
            $this->logDispatch('whatsapp_cloud_api', $to, $replyText, $result['success'], $result);
            return $result;
        }

        // 2. If UltraMsg (QR Code WhatsApp Gateway) is configured
        if (!$mockMode && !empty($ultraMsgInstance) && !empty($ultraMsgToken) && $channel === 'whatsapp') {
            $result = $this->sendViaUltraMsg($ultraMsgInstance, $ultraMsgToken, $to, $replyText);
            $this->logDispatch('ultramsg', $to, $replyText, $result['success'], $result);
            return $result;
        }

        // 3. If Evolution API (QR Code Gateway) is configured
        if (!$mockMode && !empty($evolutionUrl) && !empty($evolutionKey) && $channel === 'whatsapp') {
            $result = $this->sendViaEvolutionApi($evolutionUrl, $evolutionInstance, $evolutionKey, $to, $replyText);
            $this->logDispatch('evolution_api', $to, $replyText, $result['success'], $result);
            return $result;
        }

        // 4. If n8n outbound webhook is configured, notify n8n to send the WhatsApp/Email message
        if (!$mockMode && !empty($n8nUrl)) {
            $result = $this->sendViaN8nWebhook($n8nUrl, [
                'action' => 'send_client_reply',
                'channel' => $channel,
                'to' => $to,
                'clientName' => $clientName,
                'replyText' => $replyText,
                'ownerInstruction' => $ownerInstruction,
                'originalMessageId' => $messageId,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            $this->logDispatch('n8n_webhook', $to, $replyText, $result['success'], $result);
            return $result;
        }

        // 5. Fallback / Mock Mode: Log and simulate successful dispatch
        $simulatedId = 'outbound-' . bin2hex(random_bytes(6));
        $this->logDispatch('simulated_dispatch', $to, $replyText, true, [
            'simulatedId' => $simulatedId,
            'note' => 'Dispatched in mock/simulation mode. Real dispatch active when WhatsApp or n8n webhook is configured in .env'
        ]);

        return [
            'success' => true,
            'provider' => 'simulated_whatsapp',
            'dispatchedTo' => $to,
            'replyText' => $replyText,
            'messageId' => $simulatedId
        ];
    }

    private function sendViaWhatsAppCloudApi(string $phoneId, string $token, string $to, string $text): array {
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        $endpoint = "https://graph.facebook.com/v19.0/{$phoneId}/messages";

        $postData = [
            'messaging_product' => 'whatsapp',
            'to' => $cleanPhone,
            'type' => 'text',
            'text' => ['body' => $text]
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: Bearer {$token}"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $success = ($httpCode >= 200 && $httpCode < 300);
        return [
            'success' => $success,
            'provider' => 'whatsapp_cloud_api',
            'httpCode' => $httpCode,
            'response' => json_decode($response, true)
        ];
    }

    private function sendViaN8nWebhook(string $url, array $payload): array {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-n8n-secret: ' . ($this->config['n8n_secret'] ?? '')
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'provider' => 'n8n_outbound',
            'httpCode' => $httpCode,
            'response' => $response
        ];
    }

    private function sendViaUltraMsg(string $instanceId, string $token, string $to, string $text): array {
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        $endpoint = "https://api.ultramsg.com/{$instanceId}/messages/chat";

        $postData = [
            'token' => $token,
            'to' => $cleanPhone,
            'body' => $text
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        $sent = ($httpCode === 200 && (isset($data['sent']) && $data['sent'] === 'true' || isset($data['id'])));

        return [
            'success' => $sent,
            'provider' => 'ultramsg',
            'messageId' => $data['id'] ?? uniqid('ultra-'),
            'raw' => $data
        ];
    }

    private function sendViaEvolutionApi(string $baseUrl, string $instance, string $apiKey, string $to, string $text): array {
        $cleanPhone = preg_replace('/[^0-9]/', '', $to);
        $endpoint = rtrim($baseUrl, '/') . "/message/sendText/{$instance}";

        $postData = [
            'number' => $cleanPhone,
            'text' => $text
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "apikey: {$apiKey}"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'provider' => 'evolution_api',
            'messageId' => $data['key']['id'] ?? uniqid('evo-'),
            'raw' => $data
        ];
    }

    private function logDispatch(string $channel, string $to, string $reply, bool $success, array $details): void {
        if (!$this->db) return;

        try {
            $stmt = $this->db->prepare("
                INSERT INTO audit_logs (id, service, event, status, details)
                VALUES (?, 'outbound_messenger', 'client_reply_dispatched', ?, ?)
            ");
            $stmt->execute([
                'audit-' . bin2hex(random_bytes(8)),
                $success ? 'success' : 'failure',
                json_encode([
                    'channel' => $channel,
                    'to' => $to,
                    'replyPreview' => substr($reply, 0, 100) . '...',
                    'details' => $details
                ])
            ]);
        } catch (Exception $e) {
            error_log("Failed to log outbound dispatch: " . $e->getMessage());
        }
    }
}
