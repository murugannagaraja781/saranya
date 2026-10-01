<?php
/**
 * Naga AI Assistant (Saranya) — Hostinger Production PDO Database Connection
 * Zero credential leakage, UTF-8mb4 unicode, and robust error handling.
 */

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): ?PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $config = require __DIR__ . '/config.php';
        $db = $config['db'];

        if (empty($db['database']) || empty($db['username'])) {
            error_log("Database configuration error: DB_NAME or DB_USER is empty.");
            return null;
        }

        $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['database']};charset={$db['charset']}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$db['charset']} COLLATE utf8mb4_unicode_ci"
        ];

        try {
            self::$instance = new PDO($dsn, $db['username'], $db['password'], $options);
            return self::$instance;
        } catch (PDOException $e) {
            // Log full error safely without exposing password on screen
            error_log("Database connection failed: " . $e->getMessage());
            return null;
        }
    }
}
