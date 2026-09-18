<?php
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $setup_sql = file_get_contents('../setup.sql');
    $pdo->exec($setup_sql);

    $update_push_sql = file_get_contents('../update_push.sql');
    $pdo->exec($update_push_sql);

    echo json_encode(['success' => true, 'message' => 'Database tables and seed data created successfully!']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
