<?php
require_once 'd:\MINIMINES\MiniHelp\server\config\db.php';
$db = (new Database())->getConnection();
$stmt = $db->query('SHOW TABLES');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
