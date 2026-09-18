<?php
// api/tickets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($id) {
            // Get single ticket
            $query = "SELECT t.*, d.name as department_name, d.code as department_code, 
                      u1.name as creator_name, u2.name as assignee_name 
                      FROM tickets t 
                      LEFT JOIN departments d ON t.department_id = d.id 
                      LEFT JOIN users u1 ON t.creator_id = u1.id 
                      LEFT JOIN users u2 ON t.assignee_id = u2.id 
                      WHERE t.id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ticket) {
                // Get dynamic custom values
                $fQuery = "SELECT tcv.field_value, ff.field_label, ff.field_type 
                           FROM ticket_custom_values tcv 
                           JOIN form_fields ff ON tcv.field_id = ff.id 
                           WHERE tcv.ticket_id = :tid";
                $fStmt = $db->prepare($fQuery);
                $fStmt->bindParam(":tid", $id);
                $fStmt->execute();
                $ticket['custom_fields'] = $fStmt->fetchAll(PDO::FETCH_ASSOC);

                // Queue Position
                if (in_array($ticket['status'], ['open', 'assigned', 'waiting'])) {
                    $qQuery = "SELECT count(*) as ahead FROM tickets 
                               WHERE department_id = :did AND status IN ('open', 'assigned', 'waiting') 
                               AND created_at < :cat";
                    $qStmt = $db->prepare($qQuery);
                    $qStmt->bindParam(":did", $ticket['department_id']);
                    $qStmt->bindParam(":cat", $ticket['created_at']);
                    $qStmt->execute();
                    $ahead = $qStmt->fetch(PDO::FETCH_ASSOC)['ahead'];
                    $ticket['queue_position'] = $ahead + 1; // You are number X
                } else {
                    $ticket['queue_position'] = null; // Resolved/in_progress
                }

                echo json_encode(["success" => true, "data" => $ticket]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Ticket not found"]);
            }
        } else {
            // List all tickets
            $user_role = isset($_GET['role']) ? $_GET['role'] : 'admin';
            $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
            $dept_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
            
            $query = "SELECT t.*, d.name as department_name, d.code as department_code, 
                      u1.name as creator_name, u2.name as assignee_name 
                      FROM tickets t 
                      LEFT JOIN departments d ON t.department_id = d.id 
                      LEFT JOIN users u1 ON t.creator_id = u1.id 
                      LEFT JOIN users u2 ON t.assignee_id = u2.id ";
                      
            if ($user_role === 'employee' && $user_id) {
                $query .= "WHERE t.creator_id = :uid ";
            } else if ($user_role === 'agent' && $dept_id) {
                $query .= "WHERE t.department_id = :did OR t.creator_id = :uid ";
            } else if ($user_role === 'dept_head' && $dept_id) {
                $query .= "WHERE t.department_id = :did ";
            }
            $query .= "ORDER BY t.created_at DESC";
            
            $stmt = $db->prepare($query);
            if ($user_role === 'employee' && $user_id) {
                $stmt->bindParam(":uid", $user_id);
            } else if ($user_role === 'agent' && $dept_id) {
                $stmt->bindParam(":did", $dept_id);
                $stmt->bindParam(":uid", $user_id);
            } else if ($user_role === 'dept_head' && $dept_id) {
                $stmt->bindParam(":did", $dept_id);
            }
            $stmt->execute();
            $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $tickets]);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} 
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(!empty($data['title']) && !empty($data['description']) && !empty($data['department_id']) && !empty($data['creator_id'])) {
        try {
            $db->beginTransaction();
            $ticket_number = 'MM-' . date('Ymd') . '-' . rand(1000, 9999);
            $query = "INSERT INTO tickets SET ticket_number=:tn, title=:title, description=:desc, 
                      priority=:priority, department_id=:dept_id, creator_id=:creator_id";
            $stmt = $db->prepare($query);
            $priority = isset($data['priority']) ? $data['priority'] : 'medium';
            $stmt->execute([
                ":tn" => $ticket_number, ":title" => $data['title'], ":desc" => $data['description'],
                ":priority" => $priority, ":dept_id" => $data['department_id'], ":creator_id" => $data['creator_id']
            ]);
            $last_id = $db->lastInsertId();
            
            // Insert Custom Values
            if (!empty($data['custom_values']) && is_array($data['custom_values'])) {
                $cvQuery = "INSERT INTO ticket_custom_values (ticket_id, field_id, field_value) VALUES (:tid, :fid, :val)";
                $cvStmt = $db->prepare($cvQuery);
                foreach($data['custom_values'] as $field_id => $val) {
                    $cvStmt->execute([":tid" => $last_id, ":fid" => $field_id, ":val" => $val]);
                }
            }
            $db->commit();
            
            // --- TRIGGER WEB PUSH NOTIFICATION ---
            require_once '../vendor/autoload.php';
            $auth = [
                'VAPID' => [
                    'subject' => 'mailto:admin@minimines.com',
                    'publicKey' => 'BINJS1-br47yD9q-ytF4CQKB8m_0jmFlI0lKFdeVklUjwaJsqPNA7MsiJh-Wpj7gq-NRuHq-J0laTTf2MCrDFDI',
                    'privateKey' => 'pESv5fwAWR-Cxf5-l8y5DiSTGsI4aHEUJarBUaIIuyM',
                ]
            ];
            $webPush = new \Minishlink\WebPush\WebPush($auth);
            
            $sQuery = "SELECT p.* FROM push_subscriptions p JOIN users u ON p.user_id = u.id WHERE u.department_id = :did";
            $sStmt = $db->prepare($sQuery);
            $sStmt->execute([":did" => $data['department_id']]);
            $subs = $sStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $payload = json_encode([
                "title" => "New Ticket: " . $ticket_number,
                "body" => "Priority: " . ucfirst($priority) . "\n" . $data['title'],
                "url" => "/tickets",
                "priority" => $priority
            ]);
            
            foreach($subs as $sub) {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    "endpoint" => $sub['endpoint'],
                    "keys" => ['p256dh' => $sub['p256dh'], 'auth' => $sub['auth']],
                ]);
                $webPush->queueNotification($subscription, $payload);
            }
            foreach ($webPush->flush() as $report) {}
            // -------------------------------------
            
            echo json_encode(["success" => true, "data" => ["id" => $last_id, "ticket_number" => $ticket_number]]);
        } catch(PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Incomplete data."]);
    }
}
else if ($method === 'PATCH') {
    // Update ticket status
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if($id && !empty($data['status'])) {
        try {
            $query = "UPDATE tickets SET status=:status";
            $params = [":status" => $data['status'], ":id" => $id];
            if(isset($data['assignee_id'])) {
                $query .= ", assignee_id=:assignee_id";
                $params[":assignee_id"] = $data['assignee_id'];
            }
            $query .= " WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            echo json_encode(["success" => true, "message" => "Ticket updated."]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Incomplete data."]);
    }
}
?>
