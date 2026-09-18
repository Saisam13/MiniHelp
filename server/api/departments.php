<?php
// api/departments.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM departments ORDER BY name ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $departments = $stmt->fetchAll();
        
        echo json_encode([
            "success" => true,
            "data" => $departments
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['name']) && !empty($data['code'])) {
        try {
            $query = "INSERT INTO departments (name, code, description) VALUES (:n, :c, :d)";
            $stmt = $db->prepare($query);
            $desc = isset($data['description']) ? $data['description'] : '';
            $stmt->execute([":n" => $data['name'], ":c" => $data['code'], ":d" => $desc]);
            echo json_encode(["success" => true, "message" => "Department created successfully"]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Name and code are required."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
