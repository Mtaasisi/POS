<?php
/**
 * ZenoPay USSD Trigger Endpoint
 * Handles USSD popup trigger requests
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

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log function for debugging
function logDebug($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    if ($data) {
        $logMessage .= " - " . json_encode($data);
    }
    error_log($logMessage . "\n", 3, 'zenopay-ussd-debug.log');
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Also check GET parameters for backward compatibility
if (empty($data)) {
    $data = [
        'phone_number' => $_GET['phone'] ?? null,
        'amount' => $_GET['amount'] ?? null,
        'order_id' => $_GET['order_id'] ?? null,
        'customer_name' => $_GET['customer_name'] ?? 'Customer'
    ];
}

logDebug('USSD trigger request received', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'input' => $input,
    'data' => $data,
    'headers' => getallheaders()
]);

// Validate required fields
if (empty($data['phone_number']) || empty($data['amount']) || empty($data['order_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: phone_number, amount, order_id',
        'received_data' => $data
    ]);
    exit();
}

$phoneNumber = $data['phone_number'];
$amount = $data['amount'];
$orderId = $data['order_id'];
$customerName = $data['customer_name'] ?? 'Customer';
$timestamp = $data['timestamp'] ?? date('c');
$posSession = $data['pos_session'] ?? 'pos_' . time();

logDebug('USSD trigger parameters', [
    'phone_number' => $phoneNumber,
    'amount' => $amount,
    'order_id' => $orderId,
    'customer_name' => $customerName,
    'timestamp' => $timestamp,
    'pos_session' => $posSession
]);

// Simulate USSD popup trigger
$ussdResponse = simulateUssdPopup($phoneNumber, $amount, $orderId, $customerName);

if ($ussdResponse['success']) {
    // Store USSD session data for status checking
    $ussdSession = [
        'order_id' => $orderId,
        'phone_number' => $phoneNumber,
        'amount' => $amount,
        'customer_name' => $customerName,
        'status' => 'sent',
        'created_at' => $timestamp,
        'pos_session' => $posSession,
        'ussd_session_id' => 'ussd_' . time() . '_' . rand(1000, 9999)
    ];
    
    // Store in session file (in production, use database)
    $sessionsFile = 'ussd_sessions.json';
    $sessions = [];
    if (file_exists($sessionsFile)) {
        $sessions = json_decode(file_get_contents($sessionsFile), true) ?? [];
    }
    $sessions[$orderId] = $ussdSession;
    file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT));
    
    logDebug('USSD session stored', $ussdSession);
    
    echo json_encode([
        'success' => true,
        'message' => 'USSD popup triggered successfully',
        'data' => [
            'ussd_session_id' => $ussdSession['ussd_session_id'],
            'order_id' => $orderId,
            'phone_number' => $phoneNumber,
            'amount' => $amount,
            'status' => 'sent',
            'message' => "USSD popup sent to $phoneNumber for $amount TZS"
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => $ussdResponse['message'],
        'data' => $ussdResponse['data'] ?? null
    ]);
}

function simulateUssdPopup($phoneNumber, $amount, $orderId, $customerName) {
    logDebug('Simulating USSD popup', [
        'phone_number' => $phoneNumber,
        'amount' => $amount,
        'order_id' => $orderId,
        'customer_name' => $customerName
    ]);
    
    // Simulate API call delay
    usleep(500000); // 0.5 seconds
    
    // Simulate success (90% success rate for testing)
    $success = rand(1, 10) <= 9;
    
    if ($success) {
        return [
            'success' => true,
            'message' => 'USSD popup sent successfully',
            'data' => [
                'ussd_session_id' => 'ussd_' . time() . '_' . rand(1000, 9999),
                'popup_sent' => true,
                'timestamp' => date('c')
            ]
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to send USSD popup - network error',
            'data' => [
                'error_code' => 'NETWORK_ERROR',
                'timestamp' => date('c')
            ]
        ];
    }
}

// Log the response
logDebug('USSD trigger response sent', [
    'response_code' => http_response_code(),
    'content_length' => ob_get_length()
]);
?>
