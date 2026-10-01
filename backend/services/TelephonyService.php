<?php
/**
 * Naga AI Assistant (Saranya) — Telephony Service
 * Triggers outbound calls to Naga via Vobiz or Mock Telephony Provider.
 */

class TelephonyService {
    private array $config;
    private bool $mockMode;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/config.php';
        $this->mockMode = (bool)($this->config['mock_mode'] ?? true);
    }

    public function makeCall(string $toNumber, string $summary, ?string $answerUrl = null): array {
        if ($this->mockMode || empty($this->config['vobiz']['auth_id'])) {
            return $this->mockCall($toNumber);
        }

        $authId = $this->config['vobiz']['auth_id'];
        $authToken = $this->config['vobiz']['auth_token'];
        $callerNumber = $this->config['vobiz']['caller_number'] ?? '+918065354620';
        $baseUrl = rtrim($this->config['vobiz']['base_url'], '/');

        // Vobiz Voice API endpoint: /api/v1/Account/{auth_id}/Call/
        if (strpos($baseUrl, '/api/v1') === false) {
            $baseUrl = 'https://api.vobiz.ai/api/v1';
        }
        $endpoint = "{$baseUrl}/Account/{$authId}/Call/";

        $payload = [
            'from' => ltrim($callerNumber, '+'),
            'to' => $toNumber,
            'answer_url' => $answerUrl,
            'answer_method' => 'POST'
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-Auth-ID: ' . $authId,
            'X-Auth-Token: ' . $authToken,
            'Authorization: Basic ' . base64_encode("{$authId}:{$authToken}")
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            $data = json_decode($response, true);
            $callId = $data['request_uuid'] ?? ($data['call_uuid'] ?? ($data['api_id'] ?? uniqid('vobiz-')));
            return [
                'call_id' => $callId,
                'status' => 'calling',
                'provider' => 'vobiz'
            ];
        }

        // Fallback to mock on error
        error_log("Vobiz Call Error ($httpCode): $response");
        return $this->mockCall($toNumber);
    }

    private function mockCall(string $toNumber): array {
        return [
            'call_id' => 'mock-vobiz-' . bin2hex(random_bytes(8)),
            'status' => 'completed',
            'provider' => 'mock'
        ];
    }
}
