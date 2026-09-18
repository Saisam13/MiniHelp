<?php
// api/comments.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
    $ticket_id = isset($_GET['ticket_id']) ? $_GET['ticket_id'] : null;
    if ($ticket_id) {
        try {
            $query = "SELECT c.*, u.name as user_name, u.role as user_role 
                      FROM comments c 
                      LEFT JOIN users u ON c.user_id = u.id 
                      WHERE c.ticket_id = :tid 
                      ORDER BY c.created_at ASC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":tid", $ticket_id);
            $stmt->execute();
            $comments = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $comments]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing ticket_id"]);
    }
} 
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if(!empty($data->ticket_id) && !empty($data->user_id) && !empty($data->content)) {
        try {
            $query = "INSERT INTO comments SET ticket_id=:tid, user_id=:uid, content=:content";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(":tid", $data->ticket_id);
            $stmt->bindParam(":uid", $data->user_id);
            $stmt->bindParam(":content", $data->content);
            
            if($stmt->execute()) {
                $ticket_id = $data->ticket_id;
                // Fetch ticket details for notification
                $tStmt = $db->prepare("SELECT t.ticket_number, t.title, t.priority, t.creator_id, t.department_id, t.assignee_id FROM tickets t WHERE t.id = :tid");
                $tStmt->execute([":tid" => $ticket_id]);
                $ticket = $tStmt->fetch(PDO::FETCH_ASSOC);

                // --- PUSH NOTIFICATION (BEST EFFORT) ---
                try {
                    require_once '../vendor/autoload.php';
                    if (class_exists('\Minishlink\WebPush\WebPush')) {
                        $auth = [
                            'VAPID' => [
                                'subject' => 'mailto:admin@minimines.com',
                                'publicKey' => 'BINJS1-br47yD9q-ytF4CQKB8m_0jmFlI0lKFdeVklUjwaJsqPNA7MsiJh-Wpj7gq-NRuHq-J0laTTf2MCrDFDI',
                                'privateKey' => 'pESv5fwAWR-Cxf5-l8y5DiSTGsI4aHEUJarBUaIIuyM',
                            ]
                        ];
                        $webPush = new \Minishlink\WebPush\WebPush($auth);

                        // Notify assignee, creator, or department head
                        $sQuery = "
                            SELECT p.* FROM push_subscriptions p 
                            JOIN users u ON p.user_id = u.id 
                            WHERE p.user_id IN (:creator_id, :assignee_id) 
                            AND p.user_id != :uid
                        ";
                        $sStmt = $db->prepare($sQuery);
                        $sStmt->execute([
                            ":creator_id" => $ticket['creator_id'],
                            ":assignee_id" => $ticket['assignee_id'] ? $ticket['assignee_id'] : 0,
                            ":uid" => $data->user_id
                        ]);
                        $subs = $sStmt->fetchAll(PDO::FETCH_ASSOC);

                        $payload = json_encode([
                            "title" => "New Comment on " . $ticket['ticket_number'],
                            "body" => "Update on: " . $ticket['title'],
                            "url" => "/tickets/" . $ticket_id,
                            "priority" => $ticket['priority']
                        ]);

                        foreach($subs as $sub) {
                            $subscription = \Minishlink\WebPush\Subscription::create([
                                "endpoint" => $sub['endpoint'],
                                "keys" => ['p256dh' => $sub['p256dh'], 'auth' => $sub['auth']],
                            ]);
                            $webPush->queueNotification($subscription, $payload);
                        }
                        foreach ($webPush->flush() as $report) {}
                    }
                } catch (\Throwable $e) {
                    error_log("Push Notification Error (Comments): " . $e->getMessage());
                }

                echo json_encode(["success" => true, "message" => "Comment added"]);
            } else {
                http_response_code(503);
                echo json_encode(["success" => false, "error" => "Unable to add comment"]);
            }
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Incomplete data."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
