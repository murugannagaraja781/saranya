<?php
/**
 * Naga AI Assistant (Saranya) — Clients REST API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

$id = $_GET['id'] ?? null;

if ($id) {
    $stmt = $db->prepare("SELECT * FROM clients WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $client = $stmt->fetch();

    if (!$client) {
        Response::error('Client not found', 404);
    }

    // Get messages for this client
    $mStmt = $db->prepare("SELECT id, channel, subject, message, received_at, status FROM messages WHERE client_id = ? ORDER BY received_at DESC");
    $mStmt->execute([$id]);
    $messages = $mStmt->fetchAll();

    // Get calls for this client
    $cStmt = $db->prepare("SELECT id, channel, status, summary, duration, started_at FROM calls WHERE client_id = ? ORDER BY created_at DESC");
    $cStmt->execute([$id]);
    $calls = $cStmt->fetchAll();

    Response::json([
        'success' => true,
        'client' => $client,
        'messages' => $messages,
        'calls' => $calls
    ]);
}

// Update client notes
if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || (isset($_GET['action']) && $_GET['action'] === 'update_notes')) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $clientId = $body['id'] ?? null;
    $notes = $body['notes'] ?? '';

    if ($clientId) {
        $stmt = $db->prepare("UPDATE clients SET notes = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$notes, $clientId]);
        Response::json(['success' => true, 'updated' => true]);
    }
}

// List all clients
$stmt = $db->query("SELECT * FROM clients ORDER BY total_messages DESC, updated_at DESC");
$clients = $stmt->fetchAll();

Response::json([
    'success' => true,
    'total' => count($clients),
    'clients' => $clients
]);
