<?php
include_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    $db->exec("ALTER TABLE users MODIFY avatar_url LONGTEXT");
    echo "Column changed to LONGTEXT successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
