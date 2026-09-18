<?php
// api/upload_avatar.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';
$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "User ID is required"]);
        exit;
    }
    
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileInfo = pathinfo($_FILES['avatar']['name']);
        $ext = strtolower($fileInfo['extension']);
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid file format"]);
            exit;
        }
        
        $fileName = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
        $targetPath = $uploadDir . $fileName;
        $dbPath = '/api/uploads/avatars/' . $fileName;
        
        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $targetPath)) {
            try {
                $stmt = $db->prepare("UPDATE users SET avatar_url = :av WHERE id = :id");
                $stmt->execute([":av" => $dbPath, ":id" => $user_id]);
                
                echo json_encode(["success" => true, "avatar_url" => $dbPath]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to move uploaded file"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "No file uploaded or upload error"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
