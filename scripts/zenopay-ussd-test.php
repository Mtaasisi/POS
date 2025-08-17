<?php
/**
 * ZenoPay USSD Popup Test Handler
 * This script simulates USSD popup functionality for testing purposes
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

logDebug('USSD request received', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'input' => $input,
    'data' => $data,
    'headers' => getallheaders()
]);

// Handle different endpoints based on URL
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

if (strpos($path, 'zenopay-trigger-ussd.php') !== false) {
    handleUssdTrigger($data);
} elseif (strpos($path, 'zenopay-ussd-popup.php') !== false) {
    handleUssdStatus($data);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid endpoint',
        'path' => $path
    ]);
}

function handleUssdTrigger($data) {
    logDebug('Handling USSD trigger request', $data);
    
    // Validate required fields
    if (empty($data['phone_number']) || empty($data['amount']) || empty($data['order_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: phone_number, amount, order_id'
        ]);
        return;
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
    // In a real implementation, this would call the actual USSD API
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
}

function handleUssdStatus($data) {
    logDebug('Handling USSD status check', $data);
    
    if (empty($data['order_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing order_id'
        ]);
        return;
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
            'message' => 'USSD session not found for order: ' . $orderId
        ]);
        return;
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
logDebug('USSD response sent', [
    'response_code' => http_response_code(),
    'content_length' => ob_get_length()
]);
?>
