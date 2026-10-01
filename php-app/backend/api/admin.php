<?php
/**
 * Naga AI Assistant (Saranya) — Super Admin .env Management API
 * 
 * Protected by Admin Password: 1369 (or ADMIN_PASSWORD env variable)
 * Actions:
 *   POST ?action=login     -> Authenticate admin password, issue session token
 *   GET  ?action=get_env   -> Read and return parsed .env variables
 *   POST ?action=save_env  -> Save updated environment variables to .env
 *   POST ?action=test_db   -> Test database connection with provided or saved settings
 */

require_once __DIR__ . '/../utils/Response.php';

Response::handleCors();

// Start session safely
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. Resolve .env File Path
function resolveEnvPath(): string {
    $searchPaths = [
        __DIR__ . '/../../../.env',                     // Repo root (e.g. public_html/ai/.env)
        __DIR__ . '/../../.env',                        // php-app/.env
        __DIR__ . '/../.env',                           // backend/.env
        (isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/.env' : ''),
        (isset($_SERVER['DOCUMENT_ROOT']) ? dirname($_SERVER['DOCUMENT_ROOT']) . '/.env' : ''),
    ];

    foreach ($searchPaths as $path) {
        if (!empty($path) && file_exists($path)) {
            return realpath($path) ?: $path;
        }
    }

    // Fallback: create in php-app or parent root
    $defaultRoot = dirname(__DIR__, 2) . '/.env';
    return $defaultRoot;
}

// 2. Read and parse .env into array
function parseEnvFile(string $filePath): array {
    $vars = [];
    if (!file_exists($filePath)) {
        return $vars;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Strip quotes if wrapped
            if (preg_match('/^"(.*)"$/s', $val, $m) || preg_match("/^'(.*)'$/s", $val, $m)) {
                $val = $m[1];
            }
            $vars[$key] = $val;
        }
    }
    return $vars;
}

// 3. Write array back to .env safely (preserving comments and order)
function writeEnvFile(string $filePath, array $updates, ?string $rawContent = null): bool {
    // If raw content is explicitly provided by admin raw editor
    if ($rawContent !== null && strlen(trim($rawContent)) > 0) {
        // Backup
        if (file_exists($filePath)) {
            @copy($filePath, $filePath . '.backup_' . date('Ymd_His'));
        }
        return (bool)file_put_contents($filePath, $rawContent, LOCK_EX);
    }

    // Otherwise merge updates into existing file structure
    $existingLines = file_exists($filePath) ? file($filePath, FILE_IGNORE_NEW_LINES) : [];
    $seenKeys = [];
    $newLines = [];

    foreach ($existingLines as $line) {
        $trimmed = trim($line);
        if (empty($trimmed) || strpos($trimmed, '#') === 0) {
            $newLines[] = $line;
            continue;
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) === 2) {
            $k = trim($parts[0]);
            if (array_key_exists($k, $updates)) {
                $v = $updates[$k];
                // Quote if contains spaces or special characters
                if (preg_match('/[\s#="\'$]/', $v) || $v === '') {
                    $v = '"' . addcslashes($v, '"\\$') . '"';
                }
                $newLines[] = "{$k}={$v}";
                $seenKeys[$k] = true;
            } else {
                $newLines[] = $line;
                $seenKeys[$k] = true;
            }
        } else {
            $newLines[] = $line;
        }
    }

    // Append any new keys that were not in the file before
    foreach ($updates as $k => $v) {
        if (!isset($seenKeys[$k])) {
            if (preg_match('/[\s#="\'$]/', $v) || $v === '') {
                $v = '"' . addcslashes($v, '"\\$') . '"';
            }
            $newLines[] = "{$k}={$v}";
        }
    }

    // Backup existing before writing
    if (file_exists($filePath)) {
        @copy($filePath, $filePath . '.backup_' . date('Ymd_His'));
    }

    return (bool)file_put_contents($filePath, implode("\n", $newLines) . "\n", LOCK_EX);
}

// 4. Verify Admin Session / Token
function verifyAdminAuth(): bool {
    // Check Authorization Bearer header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        if (isset($_SESSION['admin_token']) && hash_equals($_SESSION['admin_token'], $token)) {
            return true;
        }
    }

    // Fallback: check session directly
    return !empty($_SESSION['is_super_admin']);
}

// Request Routing
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? 'get_env');
$envPath = resolveEnvPath();

// Master Admin Password: 1369 (configurable via ADMIN_PASSWORD in .env)
$currentEnv = parseEnvFile($envPath);
$masterPassword = $currentEnv['ADMIN_PASSWORD'] ?? '1369';

// ACTION: LOGIN
if ($action === 'login' && $method === 'POST') {
    $input = json_decode(file_get_contents('php-php://input' ?: 'php://input'), true) ?? $_POST;
    $password = (string)($input['password'] ?? '');

    if (hash_equals((string)$masterPassword, (string)$password)) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['admin_token'] = $token;
        $_SESSION['is_super_admin'] = true;
        $_SESSION['admin_login_time'] = time();

        Response::json([
            'success' => true,
            'message' => 'Super Admin authenticated successfully!',
            'token' => $token,
            'env_file' => basename($envPath)
        ]);
    } else {
        Response::error('Invalid Admin Password. Access Denied.', 401);
    }
    exit;
}

// All actions below require authentication
if (!verifyAdminAuth()) {
    Response::error('Unauthorized. Please enter Admin Password to access Super Admin Dashboard.', 401);
    exit;
}

// ACTION: GET CURRENT .ENV
if ($action === 'get_env' && ($method === 'GET' || $method === 'POST')) {
    $vars = parseEnvFile($envPath);
    $rawContent = file_exists($envPath) ? file_get_contents($envPath) : '';

    Response::json([
        'success' => true,
        'env_path' => $envPath,
        'variables' => $vars,
        'raw_content' => $rawContent,
        'last_modified' => file_exists($envPath) ? date('Y-m-d H:i:s', filemtime($envPath)) : null
    ]);
    exit;
}

// ACTION: SAVE .ENV
if ($action === 'save_env' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $updates = $input['variables'] ?? [];
    $rawContent = $input['raw_content'] ?? null;

    if (!is_array($updates) && $rawContent === null) {
        Response::error('Invalid payload: variables or raw_content required.', 400);
        exit;
    }

    $saved = writeEnvFile($envPath, $updates, $rawContent);

    if ($saved) {
        // Also clear OPcache if available
        if (function_exists('opcache_reset')) {
            @opcache_reset();
        }

        Response::json([
            'success' => true,
            'message' => 'Super Admin: .env configuration updated successfully!',
            'env_path' => $envPath,
            'updated_keys' => array_keys($updates),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        Response::error('Failed to write .env file. Please check file permissions (0644/0664 required).', 500);
    }
    exit;
}

// ACTION: TEST DATABASE CONNECTION
if ($action === 'test_db' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    // Use provided credentials or fallback to saved .env
    $current = parseEnvFile($envPath);
    $host = $input['DB_HOST'] ?? ($current['DB_HOST'] ?? 'localhost');
    $port = $input['DB_PORT'] ?? ($current['DB_PORT'] ?? '3306');
    $dbName = $input['DB_NAME'] ?? ($current['DB_NAME'] ?? '');
    $user = $input['DB_USER'] ?? ($current['DB_USER'] ?? '');
    $pass = $input['DB_PASSWORD'] ?? ($current['DB_PASSWORD'] ?? '');

    if (empty($dbName) || empty($user)) {
        Response::error('DB_NAME and DB_USER cannot be empty.', 400);
        exit;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        
        // Count tables
        $tablesStmt = $pdo->query("SHOW TABLES");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        Response::json([
            'success' => true,
            'message' => 'MySQL Database connection SUCCESSFUL!',
            'database' => $dbName,
            'table_count' => count($tables),
            'tables' => $tables
        ]);
    } catch (PDOException $e) {
        Response::error('Database connection FAILED: ' . $e->getMessage(), 500);
    }
    exit;
}

// Default fallback
Response::error("Unknown action: {$action}", 400);
