<?php
/**
 * Naga AI Assistant (Saranya) — Dashboard Stats API
 */

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../config/db.php';

Response::handleCors();

$config = require __DIR__ . '/../config/config.php';
$db = Database::getConnection();

if (!$db) {
    Response::error('Database connection error. Please ensure MySQL is running.', 500);
}

try {
    // 1. Messages Today
    $stmt = $db->query("SELECT COUNT(*) as count FROM messages WHERE DATE(received_at) = CURDATE()");
    $messagesToday = (int)($stmt->fetch()['count'] ?? 0);

    // 2. Important / High Priority Messages Today
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM ai_analyses a 
        JOIN messages m ON a.message_id = m.id 
        WHERE a.priority = 'high' AND DATE(m.received_at) = CURDATE()
    ");
    $importantMessages = (int)($stmt->fetch()['count'] ?? 0);

    // 3. Calls Made Total & Today
    $stmt = $db->query("SELECT COUNT(*) as count FROM calls");
    $callsMade = (int)($stmt->fetch()['count'] ?? 0);

    $stmt = $db->query("SELECT COUNT(*) as count FROM calls WHERE status = 'completed'");
    $completedCalls = (int)($stmt->fetch()['count'] ?? 0);

    // 4. Pending Tasks
    $stmt = $db->query("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'");
    $pendingTasks = (int)($stmt->fetch()['count'] ?? 0);

    // 5. Total High Priority Open Tasks
    $stmt = $db->query("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high' AND status != 'completed'");
    $highPriorityTasks = (int)($stmt->fetch()['count'] ?? 0);

    // 6. Active Clients
    $stmt = $db->query("SELECT COUNT(*) as count FROM clients");
    $activeClients = (int)($stmt->fetch()['count'] ?? 0);

    // 7. Recent High Priority Briefings (Top 5)
    $stmt = $db->query("
        SELECT 
            m.id as message_id,
            m.client_name,
            m.company,
            m.channel,
            m.subject,
            m.received_at,
            m.status as message_status,
            a.summary as tamil_summary,
            a.priority,
            a.category,
            a.should_call,
            a.next_step,
            a.deadline,
            c.id as call_id,
            c.status as call_status,
            c.duration as call_duration,
            c.owner_instruction
        FROM messages m
        LEFT JOIN ai_analyses a ON m.id = a.message_id
        LEFT JOIN calls c ON m.id = c.message_id
        ORDER BY m.received_at DESC
        LIMIT 6
    ");
    $recentMessages = $stmt->fetchAll();

    // 8. Recent Calls (Top 5)
    $stmt = $db->query("
        SELECT id, client_name, channel, phone_number, status, priority, summary, transcript, owner_instruction, duration, started_at
        FROM calls
        ORDER BY created_at DESC
        LIMIT 5
    ");
    $recentCalls = $stmt->fetchAll();

    Response::json([
        'success' => true,
        'stats' => [
            'messagesToday' => $messagesToday,
            'importantMessages' => $importantMessages,
            'callsMade' => $callsMade,
            'pendingActions' => $pendingTasks,
            'highPriorityTasks' => $highPriorityTasks,
            'activeClients' => $activeClients,
            'callAnswerRate' => $callsMade > 0 ? round(($completedCalls / $callsMade) * 100) : 100,
        ],
        'systemStatus' => [
            'assistantName' => $config['assistant']['name'] ?? 'Arya',
            'ownerName' => $config['owner']['name'] ?? 'Naga',
            'saranyaStatus' => 'ONLINE',
            'monitoring' => [
                'gmail' => true,
                'whatsapp' => true
            ],
            'voice' => $config['mock_mode'] ? 'Mock Mode' : 'SnapServe + Vobiz Active',
            'mockMode' => (bool)$config['mock_mode']
        ],
        'recentMessages' => $recentMessages,
        'recentCalls' => $recentCalls
    ]);

} catch (Exception $e) {
    Response::error("Error fetching dashboard statistics: " . $e->getMessage(), 500);
}
