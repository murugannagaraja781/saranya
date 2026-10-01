<?php
/**
 * Naga AI Assistant (Saranya) — Google Gemini AI Service
 * Analyzes client messages and generates Chennai Spoken Tamil voice briefings using Gemini 1.5 Flash REST API.
 */

require_once __DIR__ . '/../utils/Cleaner.php';

class GeminiService {
    private string $apiKey;
    private string $model;
    private bool $mockMode;
    private array $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/config.php';
        $this->apiKey = $this->config['gemini']['api_key'] ?? '';
        $this->model = $this->config['gemini']['model'] ?? 'gemini-1.5-flash';
        $this->mockMode = (bool)($this->config['mock_mode'] ?? true);
    }

    public function analyzeMessage(array $input): array {
        // If mock mode is active or no API key, use deterministic mock analyzer
        if ($this->mockMode || empty($this->apiKey)) {
            return $this->mockAnalysis($input);
        }

        try {
            $sanitizedMessage = Cleaner::sanitizeForPrompt($input['message'] ?? '');
            $sanitizedSubject = Cleaner::sanitizeForPrompt($input['subject'] ?? '');
            $assistantName = $this->config['assistant']['name'] ?? 'Arya';
            $channel = $input['channel'] ?? 'email';
            $clientName = $input['clientName'] ?? 'Unknown';
            $company = $input['company'] ?? '';
            $clientContact = $input['clientContact'] ?? '';

            $prompt = <<<PROMPT
You are {$assistantName}, the personal AI business assistant to Naga.
Your task is to analyze an incoming client message and decide if Naga needs an immediate phone call.

<system_persona_instructions>
- Role: Personal Business Assistant for Naga.
- Persona: Calm, professional, efficient, friendly, natural conversational Chennai-style Tamil.
- Summary language: Spoken Tamil written strictly using Tamil script (தமிழ் எழுத்துகள்).
- Common English business words SHOULD remain in English (e.g., client, payment, meeting, quotation, invoice, project, deadline, follow-up, delivery, confirmation, installment, OK, confirm).
- Do NOT use overly formal or literary Tamil (no "வணங்குகிறேன்", "தங்களின் மேலான பார்வைக்கு").
- Keep summary to 2-3 short, spoken Tamil sentences. Start with the conclusion.
</system_persona_instructions>

<decision_rules>
should_call = false when:
- OTP, verification codes
- Newsletters, promotions, spam, automated marketing
- Simple "OK", "Thanks", "Noted", trivial acknowledgments
- General informational note without required decision or action

should_call = true when:
- Money or payment discussed (e.g., payment approval, installment request, invoice query)
- Quotation or proposal discussed
- Client asks an important question or raises a complaint/problem
- Meeting requested or project blocker mentioned
- Deadline mentioned or delivery issue reported
- Important business decision or confirmation required from Naga

priority rules:
- "high": Money/payment involved, complaint, deadline within 48 hours, project blocker, urgent request.
- "normal": Other actionable messages requiring attention.
- "low": Informational messages without immediate action.
</decision_rules>

<metadata>
Channel: {$channel}
Provided Client Name: {$clientName}
Provided Company: {$company}
Provided Client Contact: {$clientContact}
Subject: {$sanitizedSubject}
</metadata>

<untrusted_client_message>
{$sanitizedMessage}
</untrusted_client_message>

Return ONLY a valid JSON object with the exact keys:
{
  "should_call": boolean,
  "client_name": string,
  "company": string,
  "client_contact": string,
  "channel": "{$channel}",
  "priority": "high" | "normal" | "low",
  "summary": string (2-3 short spoken Tamil sentences in Tamil script with business terms in English),
  "next_step": string (in English),
  "deadline": string (e.g. "Tomorrow", "Within 48 hours", or ""),
  "reason": string (why should_call was set to true/false),
  "category": "payment" | "quotation" | "meeting" | "project" | "deadline" | "complaint" | "question" | "confirmation" | "delivery" | "technical" | "general" | "spam" | "otp" | "promotion" | "newsletter" | "other"
}
PROMPT;

            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

            $postData = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'responseMimeType' => 'application/json'
                ]
            ];

            $ch = curl_init($endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);

            $rawResult = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($httpCode === 200 && $rawResult) {
                $responseObj = json_decode($rawResult, true);
                $candidateText = $responseObj['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if ($candidateText) {
                    $parsed = json_decode($candidateText, true);
                    if (is_array($parsed) && isset($parsed['should_call'])) {
                        return $parsed;
                    }
                }
            }

            // Fallback to mock on error
            error_log("Gemini API error ($httpCode): $curlError. Falling back to mock.");
            return $this->mockAnalysis($input);

        } catch (Exception $e) {
            error_log("Gemini API Exception: " . $e->getMessage());
            return $this->mockAnalysis($input);
        }
    }

    /**
     * High-fidelity deterministic mock analysis when offline, in dev, or without API key.
     */
    public function mockAnalysis(array $input): array {
        $raw = strtolower(($input['subject'] ?? '') . ' ' . ($input['message'] ?? ''));
        $client = $input['clientName'] ?? 'Ramesh';
        $comp = $input['company'] ?? (strpos($raw, 'abc') !== false ? 'ABC Traders' : 'Client Business');
        $contact = $input['clientContact'] ?? '+919840123456';
        $channel = $input['channel'] ?? 'email';

        // Scenario 1: Quotation approved with payment installment request
        if (strpos($raw, 'quotation') !== false && (strpos($raw, 'installment') !== false || strpos($raw, 'payment') !== false || strpos($raw, 'approved') !== false)) {
            $hasTomorrow = strpos($raw, 'tomorrow') !== false;
            return [
                'should_call' => true,
                'client_name' => $client,
                'company' => $comp,
                'client_contact' => $contact,
                'channel' => $channel,
                'priority' => 'high',
                'summary' => "{$client}, {$comp} quotation-அ OK பண்ணிட்டாரு. ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாரு. " . ($hasTomorrow ? "நாளைக்குள்ள நீங்க confirm பண்ணணும்." : "நீங்க confirm பண்ணணும்."),
                'next_step' => 'Confirm two installment payment arrangement.',
                'deadline' => $hasTomorrow ? 'Tomorrow' : '48 hours',
                'reason' => 'Quotation approved with split payment request requiring owner decision.',
                'category' => 'payment'
            ];
        }

        // Scenario 2: Project delivery inquiry
        if (strpos($raw, 'delivery') !== false || strpos($raw, 'project delivery') !== false) {
            return [
                'should_call' => true,
                'client_name' => $client,
                'company' => $comp,
                'client_contact' => $contact,
                'channel' => $channel,
                'priority' => 'high',
                'summary' => "Client project delivery date பற்றி கேட்டிருக்காங்க. அவங்களுக்கு confirmation வேணும். நீங்க delivery date confirm பண்ணணும்.",
                'next_step' => 'Confirm project delivery schedule.',
                'deadline' => 'Within 24 hours',
                'reason' => 'Urgent project delivery confirmation requested by client.',
                'category' => 'delivery'
            ];
        }

        // Scenario 3: Urgent complaint or blocker
        if (strpos($raw, 'complaint') !== false || strpos($raw, 'not working') !== false || strpos($raw, 'issue') !== false || strpos($raw, 'urgent') !== false) {
            return [
                'should_call' => true,
                'client_name' => $client,
                'company' => $comp,
                'client_contact' => $contact,
                'channel' => $channel,
                'priority' => 'high',
                'summary' => "{$client} ஒரு urgent issue பற்றி report பண்ணியிருக்காங்க. உடனே நாம check பண்ணி solve பண்ணணும்.",
                'next_step' => 'Investigate reported critical issue.',
                'deadline' => 'Immediate',
                'reason' => 'Client reported critical blocker requiring immediate intervention.',
                'category' => 'complaint'
            ];
        }

        // Scenario 4: Meeting request
        if (strpos($raw, 'meeting') !== false || strpos($raw, 'call') !== false || strpos($raw, 'discussion') !== false) {
            return [
                'should_call' => true,
                'client_name' => $client,
                'company' => $comp,
                'client_contact' => $contact,
                'channel' => $channel,
                'priority' => 'normal',
                'summary' => "{$client} ஒரு புது meeting arrange பண்ணலாம்-னு சொல்லிருக்காங்க. உங்க time slot-அ confirm பண்ணணும்.",
                'next_step' => 'Schedule client meeting slot.',
                'deadline' => 'This week',
                'reason' => 'Client requested a business discussion meeting.',
                'category' => 'meeting'
            ];
        }

        // Default General Inbound
        return [
            'should_call' => false,
            'client_name' => $client,
            'company' => $comp,
            'client_contact' => $contact,
            'channel' => $channel,
            'priority' => 'low',
            'summary' => "{$client}-கிட்ட இருந்து பொதுவான தகவல் வந்துள்ளது.",
            'next_step' => 'Review message in inbox.',
            'deadline' => '',
            'reason' => 'General informational note without urgent action required.',
            'category' => 'general'
        ];
    }
}
