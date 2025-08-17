<?php
/**
 * ZenoPay Create Order Script
 * 
 * Creates a payment order using ZenoPay Mobile Money Tanzania API
 * 
 * Usage:
 * POST to this file with:
 * - buyer_email: Customer email
 * - buyer_name: Customer name
 * - buyer_phone: Customer phone (Tanzanian format)
 * - amount: Amount in TZS
 * - order_id: Optional custom order ID
 * - webhook_url: Optional custom webhook URL
 * - metadata: Optional JSON metadata
 */

require_once 'zenopay-config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-ZP-API-KEY, X-ZP-BASE-URL, X-ZP-WEBHOOK-URL');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) { $input = []; }

    // Allow runtime overrides from UI (headers or body): API key, base URL, webhook URL
    $overrideApiKey = $_SERVER['HTTP_X_ZP_API_KEY'] ?? ($input['api_key'] ?? null);
    $overrideBaseUrl = $_SERVER['HTTP_X_ZP_BASE_URL'] ?? ($input['base_url'] ?? null);
    $overrideWebhook = $_SERVER['HTTP_X_ZP_WEBHOOK_URL'] ?? ($input['webhook_url'] ?? null);

    $effectiveApiKey = !empty($overrideApiKey) ? $overrideApiKey : ZP_API_KEY;
    $effectiveBaseUrl = !empty($overrideBaseUrl) ? rtrim($overrideBaseUrl, '/') . '' : ZP_BASE_URL;
    $effectiveWebhook = !empty($overrideWebhook) ? $overrideWebhook : ZP_WEBHOOK_URL;
    
    // Validate required fields
    $requiredFields = ['buyer_email', 'buyer_name', 'buyer_phone', 'amount'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }
    
    // Validate email
    if (!filter_var($input['buyer_email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    // Validate phone number (Tanzanian format)
    $phone = preg_replace('/[^0-9]/', '', $input['buyer_phone']);
    if (strlen($phone) < 9 || strlen($phone) > 12) {
        throw new Exception('Invalid phone number format');
    }
    
    // Validate amount
    if (!is_numeric($input['amount']) || $input['amount'] <= 0) {
        throw new Exception('Invalid amount');
    }
    
    // Prepare order data
    $orderData = [
        'order_id'    => $input['order_id'] ?? uniqid('lats_', true),
        'buyer_email' => $input['buyer_email'],
        'buyer_name'  => $input['buyer_name'],
        'buyer_phone' => $phone,
        'amount'      => (int)$input['amount'],
        'webhook_url' => $effectiveWebhook,
    ];
    
    // Add metadata if provided
    if (!empty($input['metadata'])) {
        $orderData['metadata'] = $input['metadata'];
    }
    
    // Make API request
    $ch = curl_init($effectiveBaseUrl . '/mobile_money_tanzania');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $effectiveApiKey,
        ],
        CURLOPT_POSTFIELDS     => json_encode($orderData),
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        zp_log_error("cURL Error: {$curlError}");
        throw new Exception('Request failed: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        zp_log_error("HTTP Error: {$httpCode} - {$response}");
        throw new Exception("HTTP {$httpCode}: {$response}");
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        zp_log_error("JSON decode error: " . json_last_error_msg());
        throw new Exception('Invalid response format');
    }
    
    if ($data['status'] === 'success') {
        echo json_encode([
            'success' => true,
            'order_id' => $data['order_id'],
            'message' => $data['message'],
            'resultcode' => $data['resultcode'] ?? null,
            'data' => $orderData
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $data['message'] ?? 'Unknown error',
            'resultcode' => $data['resultcode'] ?? null
        ]);
    }
    
} catch (Exception $e) {
    zp_log_error("Create order error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
