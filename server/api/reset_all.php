<?php
// api/reset_all.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/db.php';
$database = new Database();
$db = $database->getConnection();

try {
    // 1. Delete all ticket-related data
    $db->exec("DELETE FROM ticket_activity_log");
    $db->exec("DELETE FROM ticket_attachments");
    $db->exec("DELETE FROM ticket_comments");
    $db->exec("DELETE FROM notifications");
    
    // 2. Delete all tickets
    $db->exec("DELETE FROM tickets");
    
    // 3. Clear users' department_id so we can delete departments
    $db->exec("UPDATE users SET department_id = NULL");
    
    // 4. Delete categories and custom fields
    $db->exec("DELETE FROM ticket_categories");
    $db->exec("DELETE FROM ticket_custom_fields");
    
    // 5. Delete all departments
    $db->exec("DELETE FROM departments");
    
    // 6. Re-seed default departments (Excluding Finance)
    $depts = [
        ['IT Support', 'IT', 'Computers, Access, Networks'],
        ['Human Resources', 'HR', 'Payroll, Leaves, Onboarding'],
        ['Facilities', 'FAC', 'Building, Maintenance, Supplies']
    ];
    
    $stmt = $db->prepare("INSERT INTO departments (name, code, description) VALUES (?, ?, ?)");
    foreach ($depts as $dept) {
        $stmt->execute($dept);
    }
    
    // Also re-seed basic categories for IT and HR just to be helpful
    $itId = $db->query("SELECT id FROM departments WHERE code = 'IT'")->fetchColumn();
    if ($itId) {
        $db->exec("INSERT INTO ticket_categories (department_id, name) VALUES ($itId, 'Software')");
        $db->exec("INSERT INTO ticket_categories (department_id, name) VALUES ($itId, 'Hardware')");
        $db->exec("INSERT INTO ticket_categories (department_id, name) VALUES ($itId, 'Network')");
    }
    
    $hrId = $db->query("SELECT id FROM departments WHERE code = 'HR'")->fetchColumn();
    if ($hrId) {
        $db->exec("INSERT INTO ticket_categories (department_id, name) VALUES ($hrId, 'Payroll')");
        $db->exec("INSERT INTO ticket_categories (department_id, name) VALUES ($hrId, 'Leaves')");
    }

    echo json_encode([
        "success" => true, 
        "message" => "Database successfully wiped and reset. All tickets deleted. Departments recreated (without Finance)."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Reset failed: " . $e->getMessage()
    ]);
}
?>
