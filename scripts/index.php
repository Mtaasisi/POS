<?php
/**
 * ZenoPay USSD PHP Server Router
 * Routes requests to the appropriate handler
 */

// Set CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route to the appropriate handler
if (strpos($path, 'zenopay-trigger-ussd.php') !== false) {
    include 'zenopay-ussd-test.php';
} elseif (strpos($path, 'zenopay-ussd-popup.php') !== false) {
    include 'zenopay-ussd-test.php';
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint not found',
        'available_endpoints' => [
            '/zenopay-trigger-ussd.php',
            '/zenopay-ussd-popup.php'
        ],
        'requested_path' => $path
    ]);
}
