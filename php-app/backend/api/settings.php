<?php
/**
 * Naga AI Assistant (Saranya) — Settings REST API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

// 1. UPDATE Settings
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    if ($body) {
        $stmt = $db->prepare("
            UPDATE settings 
            SET assistant_name = COALESCE(NULLIF(?, ''), assistant_name),
                owner_name = COALESCE(NULLIF(?, ''), owner_name),
                owner_phone = COALESCE(NULLIF(?, ''), owner_phone),
                owner_email = COALESCE(NULLIF(?, ''), owner_email),
                language = COALESCE(NULLIF(?, ''), language),
                quiet_hours_enabled = ?,
                quiet_hours_start = ?,
                quiet_hours_end = ?,
                allow_high_priority_in_quiet_hours = ?,
                mock_mode = ?,
                gemini_api_key = COALESCE(NULLIF(?, ''), gemini_api_key),
                updated_at = NOW()
            LIMIT 1
        ");
        $stmt->execute([
            $body['assistantName'] ?? null,
            $body['ownerName'] ?? null,
            $body['ownerPhone'] ?? null,
            $body['ownerEmail'] ?? null,
            $body['language'] ?? 'Tamil',
            !empty($body['quietHoursEnabled']) ? 1 : 0,
            $body['quietHoursStart'] ?? '22:00',
            $body['quietHoursEnd'] ?? '07:00',
            !empty($body['allowHighPriorityInQuietHours']) ? 1 : 0,
            !empty($body['mockMode']) ? 1 : 0,
            $body['geminiApiKey'] ?? null
        ]);

        Response::json(['success' => true, 'message' => 'Settings updated successfully']);
    }
}

// 2. GET Settings
$stmt = $db->query("SELECT * FROM settings LIMIT 1");
$settings = $stmt->fetch();

if (!$settings) {
    $config = require __DIR__ . '/../config/config.php';
    Response::json([
        'success' => true,
        'settings' => [
            'assistant_name' => $config['assistant']['name'],
            'owner_name' => $config['owner']['name'],
            'owner_phone' => $config['owner']['phone'],
            'owner_email' => $config['owner']['email'],
            'language' => $config['assistant']['language'],
            'voice_style' => $config['assistant']['voice_style'],
            'quiet_hours_enabled' => 1,
            'quiet_hours_start' => '22:00',
            'quiet_hours_end' => '07:00',
            'mock_mode' => $config['mock_mode'] ? 1 : 0
        ]
    ]);
}

// Mask sensitive keys for safety
if (!empty($settings['gemini_api_key'])) {
    $settings['gemini_api_key'] = substr($settings['gemini_api_key'], 0, 4) . '...' . substr($settings['gemini_api_key'], -4);
}
if (!empty($settings['vobiz_auth_token'])) {
    $settings['vobiz_auth_token'] = '********';
}
if (!empty($settings['snapserve_api_key'])) {
    $settings['snapserve_api_key'] = '********';
}

Response::json(['success' => true, 'settings' => $settings]);
