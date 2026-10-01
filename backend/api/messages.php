<?php
/**
 * Naga AI Assistant (Saranya) — Messages REST API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

$id = $_GET['id'] ?? null;

// Single Message Detail
if ($id) {
    $stmt = $db->prepare("
        SELECT 
            m.*,
            a.should_call,
            a.summary as tamil_summary,
            a.priority,
            a.next_step,
            a.deadline,
            a.reason,
            a.category,
            a.model,
            c.id as call_id,
            c.status as call_status,
            c.duration as call_duration,
            c.transcript as call_transcript,
            c.owner_instruction
        FROM messages m
        LEFT JOIN ai_analyses a ON m.id = a.message_id
        LEFT JOIN calls c ON m.id = c.message_id
        WHERE m.id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $msg = $stmt->fetch();

    if (!$msg) {
        Response::error('Message not found', 404);
    }

    Response::json(['success' => true, 'message' => $msg]);
}

// Messages List
$channel = $_GET['channel'] ?? null;
$priority = $_GET['priority'] ?? null;
$status = $_GET['status'] ?? null;
$search = $_GET['search'] ?? null;

$sql = "
    SELECT 
        m.id,
        m.client_id,
        m.client_name,
        m.company,
        m.channel,
        m.subject,
        m.clean_message,
        m.received_at,
        m.status,
        a.should_call,
        a.priority,
        a.category,
        a.summary as tamil_summary,
        a.next_step,
        a.deadline,
        c.id as call_id,
        c.status as call_status,
        c.duration as call_duration,
        c.owner_instruction
    FROM messages m
    LEFT JOIN ai_analyses a ON m.id = a.message_id
    LEFT JOIN calls c ON m.id = c.message_id
    WHERE 1=1
";
$params = [];

if ($channel && in_array($channel, ['email', 'whatsapp'])) {
    $sql .= " AND m.channel = ?";
    $params[] = $channel;
}

if ($priority && in_array($priority, ['high', 'normal', 'low'])) {
    $sql .= " AND a.priority = ?";
    $params[] = $priority;
}

if ($status) {
    $sql .= " AND m.status = ?";
    $params[] = $status;
}

if ($search) {
    $sql .= " AND (m.client_name LIKE ? OR m.company LIKE ? OR m.subject LIKE ? OR m.message LIKE ?)";
    $term = "%{$search}%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

$sql .= " ORDER BY m.received_at DESC LIMIT 50";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$messages = $stmt->fetchAll();

Response::json([
    'success' => true,
    'total' => count($messages),
    'messages' => $messages
]);
