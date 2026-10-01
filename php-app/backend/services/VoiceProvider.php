<?php
/**
 * Naga AI Assistant (Saranya) — Voice Provider Service
 * Generates spoken Tamil briefings, handles SnapServe AI Voice calls, and generates mock transcripts.
 */

class VoiceProvider {
    private array $config;
    private bool $mockMode;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/config.php';
        $this->mockMode = (bool)($this->config['mock_mode'] ?? true);
    }

    public function triggerVoiceCall(array $payload): array {
        if ($this->mockMode || empty($this->config['snapserve']['api_key'])) {
            return $this->mockVoiceCall($payload);
        }

        $apiKey = $this->config['snapserve']['api_key'];
        $agentId = $this->config['snapserve']['agent_id'];
        $baseUrl = rtrim($this->config['snapserve']['base_url'], '/');

        $endpoint = "{$baseUrl}/agents/{$agentId}/calls";
        $postData = [
            'recipient_phone' => $payload['recipientPhone'],
            'variables' => [
                'owner_name' => $payload['ownerName'],
                'client_name' => $payload['clientName'],
                'channel' => $payload['channel'],
                'summary' => $payload['summary'],
                'next_step' => $payload['nextStep'],
                'priority' => $payload['priority'],
                'deadline' => $payload['deadline'] ?? ''
            ]
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: Bearer {$apiKey}"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && $response) {
            $data = json_decode($response, true);
            return [
                'provider_call_id' => $data['call_id'] ?? ($data['id'] ?? uniqid('snapserve-')),
                'status' => $data['status'] ?? 'calling',
                'provider' => 'snapserve',
                'transcript' => null,
                'owner_instruction' => null,
                'duration' => 0
            ];
        }

        return $this->mockVoiceCall($payload);
    }

    public function mockVoiceCall(array $payload): array {
        $providerCallId = 'mock-snapserve-' . bin2hex(random_bytes(8));
        $channelInTamil = ($payload['channel'] === 'whatsapp') ? 'WhatsApp' : 'Email';
        $assistantName = $this->config['assistant']['name'] ?? 'Arya';
        $ownerName = $payload['ownerName'] ?? 'Naga';
        $clientName = $payload['clientName'] ?? 'Client';
        $summary = $payload['summary'] ?? '';
        $deadlineText = !empty($payload['deadline']) ? "Deadline: {$payload['deadline']}." : '';

        // Determine realistic owner instruction based on message category/summary
        $simulatedInstruction = 'Two installment okay என்று note பண்ணு.';
        if (stripos($summary, 'delivery') !== false) {
            $simulatedInstruction = 'Tomorrow 5 PM delivery confirm பண்ணு.';
        } elseif (($payload['priority'] ?? '') === 'high' && (stripos($summary, 'issue') !== false || stripos($summary, 'urgent') !== false)) {
            $simulatedInstruction = 'Tech team-ஐ உடனே fix பண்ண சொல்லு.';
        } elseif (stripos($summary, 'meeting') !== false) {
            $simulatedInstruction = 'Tomorrow 3 PM meeting slot confirm பண்ணு.';
        }

        $greeting = "வணக்கம் {$ownerName}! நான் {$assistantName}. உங்க client {$clientName} கிட்ட இருந்து {$channelInTamil}-ல ஒரு முக்கியமான reply வந்திருக்கு.";
        $question = "இதுக்கு நான் என்ன note பண்ணணும்?";
        $confirmation = "சரி {$ownerName}. \"{$simulatedInstruction}\"-ன்னு note பண்ணிட்டேன். Bye.";

        $fullTranscript = implode("\n\n", [
            "{$assistantName}: \"{$greeting}\"",
            "{$assistantName}: \"{$summary} {$deadlineText}\"",
            "{$assistantName}: \"{$question}\"",
            "{$ownerName}: \"{$simulatedInstruction}\"",
            "{$assistantName}: \"{$confirmation}\""
        ]);

        return [
            'provider_call_id' => $providerCallId,
            'status' => 'completed',
            'provider' => 'mock',
            'transcript' => $fullTranscript,
            'owner_instruction' => $simulatedInstruction,
            'duration' => rand(35, 55)
        ];
    }
}
