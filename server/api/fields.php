<?php
require_once '../config/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$database = new Database();
$db = $database->getConnection();

if ($method === 'GET') {
    $cat_id = isset($_GET['category_id']) ? $_GET['category_id'] : null;
    
    if ($cat_id) {
        try {
            $stmt = $db->prepare("SELECT * FROM form_fields WHERE category_id = :cid");
            $stmt->bindParam(":cid", $cat_id);
            $stmt->execute();
            $fields = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $fields]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "category_id is required"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
