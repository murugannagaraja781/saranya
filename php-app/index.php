<?php
/**
 * Naga AI Assistant (Saranya) — Subfolder Entry Point
 * Used when Hostinger document root is configured directly to public_html/ai/php-app
 */

$dashboardFile = __DIR__ . '/public/index.html';
if (file_exists($dashboardFile)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($dashboardFile);
    exit;
}

require_once __DIR__ . '/backend/index.php';
