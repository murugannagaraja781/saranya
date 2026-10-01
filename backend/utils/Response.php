<?php
/**
 * Naga AI Assistant (Saranya) — Response Helper
 */

class Response {
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-n8n-secret, x-idempotency-key, x-request-id');

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $statusCode = 400, $details = null): void {
        self::json([
            'success' => false,
            'error' => $message,
            'details' => $details
        ], $statusCode);
    }

    public static function handleCors(): void {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-n8n-secret, x-idempotency-key, x-request-id');
            http_response_code(204);
            exit;
        }
    }
}
