<?php
/**
 * Naga AI Assistant (Saranya) — Hostinger Production Entry Point
 * 
 * Deployment Target: https://ai.tenkasidreams.com
 * Document Root: public_html/ai
 */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// 1. Route API & Webhook requests to the backend router if invoked directly
if (strpos($path, '/backend/') === 0 || strpos($path, '/api/') === 0 || strpos($path, '/webhooks/') === 0) {
    $backendEntry = __DIR__ . '/php-app/backend/index.php';
    if (file_exists($backendEntry)) {
        require_once $backendEntry;
        exit;
    }
}

// 2. Serve the Executive Dashboard HTML5 Frontend
$dashboardFile = __DIR__ . '/php-app/public/index.html';
if (file_exists($dashboardFile)) {
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    readfile($dashboardFile);
    exit;
}

// Fallback message if files are missing
http_response_code(500);
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'status' => 'ERROR',
    'message' => 'Naga AI Assistant (Saranya) — Frontend dashboard file not found at php-app/public/index.html',
    'timestamp' => date('Y-m-d H:i:s')
]);
