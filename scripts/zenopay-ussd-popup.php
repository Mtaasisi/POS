<?php
/**
 * ZenoPay USSD Popup Status Check Endpoint
 * Handles USSD status check requests
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
        'order_id' => $_GET['order_id'] ?? null,
        'check_type' => $_GET['check_type'] ?? 'ussd_status'
    ];
}

logDebug('USSD status check request received', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'input' => $input,
    'data' => $data,
    'headers' => getallheaders()
]);

if (empty($data['order_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing order_id',
        'received_data' => $data
    ]);
    exit();
}

$orderId = $data['order_id'];
$checkType = $data['check_type'] ?? 'ussd_status';

// Load USSD sessions
$sessionsFile = 'ussd_sessions.json';
$sessions = [];
if (file_exists($sessionsFile)) {
    $sessions = json_decode(file_get_contents($sessionsFile), true) ?? [];
}

if (!isset($sessions[$orderId])) {
    echo json_encode([
        'success' => false,
        'message' => 'USSD session not found for order: ' . $orderId,
        'available_sessions' => array_keys($sessions)
    ]);
    exit();
}

$session = $sessions[$orderId];
$status = $session['status'];

// Simulate status progression (in real implementation, check actual USSD status)
$status = simulateStatusProgression($session);

// Update session status
$sessions[$orderId]['status'] = $status;
$sessions[$orderId]['last_checked'] = date('c');
file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT));

logDebug('USSD status check result', [
    'order_id' => $orderId,
    'status' => $status,
    'session' => $session
]);

echo json_encode([
    'success' => true,
    'status' => $status,
    'data' => [
        'order_id' => $orderId,
        'phone_number' => $session['phone_number'],
        'amount' => $session['amount'],
        'customer_name' => $session['customer_name'],
        'ussd_session_id' => $session['ussd_session_id'],
        'created_at' => $session['created_at'],
        'last_checked' => date('c')
    ]
]);

function simulateStatusProgression($session) {
    $currentStatus = $session['status'];
    $createdAt = strtotime($session['created_at']);
    $timeElapsed = time() - $createdAt;
    
    logDebug('Simulating status progression', [
        'current_status' => $currentStatus,
        'time_elapsed' => $timeElapsed,
        'created_at' => $session['created_at']
    ]);
    
    // Simulate status progression based on time elapsed
    if ($currentStatus === 'sent') {
        if ($timeElapsed < 10) {
            return 'sent'; // Still sent
        } elseif ($timeElapsed < 30) {
            // 70% chance of pending, 20% chance of completed, 10% chance of failed
            $rand = rand(1, 10);
            if ($rand <= 7) {
                return 'pending';
            } elseif ($rand <= 9) {
                return 'completed';
            } else {
                return 'failed';
            }
        } else {
            // After 30 seconds, higher chance of completion
            $rand = rand(1, 10);
            if ($rand <= 8) {
                return 'completed';
            } elseif ($rand <= 9) {
                return 'failed';
            } else {
                return 'cancelled';
            }
        }
    } elseif ($currentStatus === 'pending') {
        if ($timeElapsed < 60) {
            // 60% chance of completed, 30% chance of failed, 10% chance of cancelled
            $rand = rand(1, 10);
            if ($rand <= 6) {
                return 'completed';
            } elseif ($rand <= 9) {
                return 'failed';
            } else {
                return 'cancelled';
            }
        } else {
            // After 1 minute, mostly completed
            $rand = rand(1, 10);
            if ($rand <= 9) {
                return 'completed';
            } else {
                return 'failed';
            }
        }
    }
    
    return $currentStatus; // Keep current status if no progression
}

// Log the response
logDebug('USSD status response sent', [
    'response_code' => http_response_code(),
    'content_length' => ob_get_length()
]);
?>
