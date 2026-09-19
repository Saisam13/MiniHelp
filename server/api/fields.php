<?php
require_once '../config/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$database = new Database();
$db = $database->getConnection();

if ($method === 'GET') {
    $dept_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
    
    if ($dept_id) {
        try {
            $stmt = $db->prepare("SELECT * FROM form_fields WHERE department_id = :did");
            $stmt->bindParam(":did", $dept_id);
            $stmt->execute();
            $fields = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $fields]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "department_id is required"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
