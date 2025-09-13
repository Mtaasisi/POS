<?php
// Simple test to verify PHP is working
header('Content-Type: application/json');

echo json_encode([
    'status' => 'PHP is working',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
]);
?>
