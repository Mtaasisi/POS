<?php
/**
 * ZenoPay Check Order Status Script
 * 
 * Checks the status of a payment order using ZenoPay API
 * 
 * Usage:
 * GET: ?order_id=ORDER_ID
 * POST: {"order_id": "ORDER_ID"}
 */

require_once 'zenopay-config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-ZP-API-KEY, X-ZP-BASE-URL, X-ZP-WEBHOOK-URL');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET and POST requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get order ID from request
    $orderId = null;
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $orderId = $_GET['order_id'] ?? null;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $orderId = $input['order_id'] ?? null;
    }

    if (!isset($input)) { $input = []; }

    // Allow runtime overrides (headers or body)
    $overrideApiKey = $_SERVER['HTTP_X_ZP_API_KEY'] ?? ($input['api_key'] ?? null);
    $overrideBaseUrl = $_SERVER['HTTP_X_ZP_BASE_URL'] ?? ($input['base_url'] ?? null);

    $effectiveApiKey = !empty($overrideApiKey) ? $overrideApiKey : ZP_API_KEY;
    $effectiveBaseUrl = !empty($overrideBaseUrl) ? rtrim($overrideBaseUrl, '/') . '' : ZP_BASE_URL;
    
    if (empty($orderId)) {
        throw new Exception('Order ID is required');
    }
    
    // Validate order ID format - allow dots for uniqid() generated IDs
    if (!preg_match('/^[a-zA-Z0-9_.-]+$/', $orderId)) {
        throw new Exception('Invalid order ID format');
    }
    
    // Make API request
    $url = $effectiveBaseUrl . '/order-status?order_id=' . urlencode($orderId);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: ' . $effectiveApiKey,
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        zp_log_error("cURL Error checking status: {$curlError}");
        throw new Exception('Request failed: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        zp_log_error("HTTP Error checking status: {$httpCode} - {$response}");
        throw new Exception("HTTP {$httpCode}: {$response}");
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        zp_log_error("JSON decode error checking status: " . json_last_error_msg());
        throw new Exception('Invalid response format');
    }
    
    // Process response
    if ($data['result'] === 'SUCCESS' || $data['result'] === 'FAIL') {
        $orders = [];
        if (!empty($data['data'])) {
            foreach ($data['data'] as $order) {
                $orders[] = [
                    'order_id' => $order['order_id'],
                    'payment_status' => $order['payment_status'],
                    'amount' => $order['amount'],
                    'reference' => $order['reference'] ?? null,
                    'buyer_email' => $order['buyer_email'] ?? null,
                    'buyer_name' => $order['buyer_name'] ?? null,
                    'buyer_phone' => $order['buyer_phone'] ?? null,
                    'created_at' => $order['created_at'] ?? null,
                    'updated_at' => $order['updated_at'] ?? null,
                    'metadata' => $order['metadata'] ?? null
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'result' => $data['result'],
            'orders' => $orders,
            'count' => count($orders),
            'message' => $data['message'] ?? null
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $data['message'] ?? 'Order not found or error occurred',
            'result' => $data['result'] ?? null
        ]);
    }
    
} catch (Exception $e) {
    zp_log_error("Check status error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
