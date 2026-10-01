<?php
/**
 * Naga AI Assistant (Saranya) — Action Tasks REST API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

$db = Database::getConnection();
if (!$db) {
    Response::error('Database unavailable', 500);
}

// 1. UPDATE Task Status
if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || (isset($_GET['action']) && $_GET['action'] === 'update')) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    $taskId = $body['id'] ?? ($_GET['id'] ?? null);
    $status = $body['status'] ?? 'completed';

    if (!$taskId) {
        Response::error('Task ID is required', 400);
    }

    $stmt = $db->prepare("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $taskId]);

    Response::json(['success' => true, 'updated' => true]);
}

// 2. CREATE Task Manually
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);

    if (empty($body['title'])) {
        Response::error('Task title is required', 400);
    }

    $taskId = 'task-' . bin2hex(random_bytes(8));
    $stmt = $db->prepare("
        INSERT INTO tasks (id, title, description, client_name, priority, status, due_date, source)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, 'manual')
    ");
    $stmt->execute([
        $taskId,
        $body['title'],
        $body['description'] ?? '',
        $body['clientName'] ?? 'Naga',
        $body['priority'] ?? 'normal',
        $body['dueDate'] ?? 'Tomorrow'
    ]);

    Response::json(['success' => true, 'taskId' => $taskId]);
}

// 3. GET: List Tasks
$status = $_GET['status'] ?? null;
$priority = $_GET['priority'] ?? null;

$sql = "SELECT * FROM tasks WHERE 1=1";
$params = [];

if ($status && in_array($status, ['pending', 'in_progress', 'completed', 'cancelled'])) {
    $sql .= " AND status = ?";
    $params[] = $status;
}

if ($priority && in_array($priority, ['high', 'normal', 'low'])) {
    $sql .= " AND priority = ?";
    $params[] = $priority;
}

$sql .= " ORDER BY FIELD(priority, 'high', 'normal', 'low'), created_at DESC LIMIT 50";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$tasks = $stmt->fetchAll();

Response::json([
    'success' => true,
    'total' => count($tasks),
    'tasks' => $tasks
]);
