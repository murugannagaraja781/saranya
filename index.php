<?php
/**
 * Naga AI Assistant (Saranya) — Hostinger Production Entry Point
 * 
 * Deployment Target: https://ai.tenkasidreams.com
 * Document Root: public_html/ai
 */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// 1. Route API & Webhook requests to the actual PHP endpoint
if (strpos($path, '/backend/') === 0 || strpos($path, '/api/') === 0 || strpos($path, '/webhooks/') === 0) {
    $directFile = __DIR__ . $path;
    $phpAppFile = __DIR__ . '/php-app' . $path;
    if (file_exists($directFile) && is_file($directFile)) {
        require_once $directFile;
        exit;
    }
    if (file_exists($phpAppFile) && is_file($phpAppFile)) {
        require_once $phpAppFile;
        exit;
    }
    $backendEntry = __DIR__ . '/php-app/backend/index.php';
    if (file_exists($backendEntry)) {
        require_once $backendEntry;
        exit;
    }
}

// 2. Route Super Admin Dashboard
if ($path === '/admin' || $path === '/admin/' || $path === '/admin.html') {
    $adminFile = file_exists(__DIR__ . '/admin.html') ? __DIR__ . '/admin.html' : __DIR__ . '/php-app/public/admin.html';
    if (file_exists($adminFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Content-Type-Options: nosniff');
        readfile($adminFile);
        exit;
    }
}

// 3. Route Interactive Workflow Guide
if ($path === '/workflow' || $path === '/workflow/' || $path === '/workflow.html') {
    $workflowFile = file_exists(__DIR__ . '/workflow.html') ? __DIR__ . '/workflow.html' : __DIR__ . '/php-app/public/workflow.html';
    if (file_exists($workflowFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Content-Type-Options: nosniff');
        readfile($workflowFile);
        exit;
    }
}

// 4. Serve the Executive Dashboard HTML5 Frontend
$dashboardFile = file_exists(__DIR__ . '/public/index.html') ? __DIR__ . '/public/index.html' : __DIR__ . '/php-app/public/index.html';
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
    'message' => 'Naga AI Assistant (Arya) — Frontend dashboard file not found at php-app/public/index.html',
    'timestamp' => date('Y-m-d H:i:s')
]);
