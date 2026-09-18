<?php
require_once '../config/db.php';

$database = new Database();
$pdo = $database->getConnection();

header('Content-Type: application/json');

try {
    $new_password = 'password123';
    $hash = password_hash($new_password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = 'admin@minimines.com'");
    $stmt->execute([$hash]);

    echo json_encode(['success' => true, 'message' => 'Password reset successfully to: password123']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
