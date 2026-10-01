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
        $callerNumber = $this->config['vobiz']['caller_number'] ?? '+914400000000';
        $baseUrl = rtrim($this->config['vobiz']['base_url'], '/');

        $endpoint = "{$baseUrl}/Accounts/{$authId}/Calls";
        $payload = [
            'to' => $toNumber,
            'from' => $callerNumber,
            'answer_url' => $answerUrl,
            'extra_params' => ['summary' => $summary]
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode("{$authId}:{$authToken}")
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            $data = json_decode($response, true);
            return [
                'call_id' => $data['call_uuid'] ?? ($data['id'] ?? uniqid('vobiz-')),
                'status' => $data['status'] ?? 'calling',
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
