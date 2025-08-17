<?php
/**
 * ZenoPay Webhook Handler
 * 
 * Receives payment status updates from ZenoPay API
 * 
 * This endpoint should be publicly accessible and configured in your ZenoPay dashboard
 * as the webhook URL for receiving payment notifications.
 */

require_once 'zenopay-config.php';

// Allow runtime overrides from UI
$overrideApiKey = $_SERVER['HTTP_X_ZP_API_KEY'] ?? null;
$effectiveApiKey = !empty($overrideApiKey) ? $overrideApiKey : ZP_API_KEY;

// Set CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, X-ZP-API-KEY, X-ZP-BASE-URL, X-ZP-WEBHOOK-URL');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Verify API key from headers
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($apiKey !== $effectiveApiKey) {
        zp_log_error("Invalid API key in webhook: {$apiKey}");
        http_response_code(403);
        echo json_encode(['error' => 'Invalid API key']);
        exit();
    }
    
    // Get the raw payload
    $payload = file_get_contents('php://input');
    
    if (empty($payload)) {
        zp_log_error("Empty webhook payload received");
        http_response_code(400);
        echo json_encode(['error' => 'Empty payload']);
        exit();
    }
    
    // Log the webhook payload
    zp_log_webhook($payload);
    
    // Parse JSON payload
    $data = json_decode($payload, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        zp_log_error("JSON decode error in webhook: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit();
    }
    
    // Validate required fields
    $requiredFields = ['order_id', 'payment_status'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            zp_log_error("Missing required field in webhook: {$field}");
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: {$field}"]);
            exit();
        }
    }
    
    // Extract data
    $orderId = $data['order_id'];
    $paymentStatus = $data['payment_status'];
    $reference = $data['reference'] ?? null;
    $metadata = $data['metadata'] ?? null;
    
    // Log the processed data
    zp_log_webhook("Processed webhook - Order ID: {$orderId}, Status: {$paymentStatus}, Reference: {$reference}");
    
    // Process the payment status
    switch (strtoupper($paymentStatus)) {
        case 'COMPLETED':
            // Payment was successful
            processSuccessfulPayment($orderId, $reference, $metadata);
            break;
            
        case 'FAILED':
        case 'CANCELLED':
            // Payment failed or was cancelled
            processFailedPayment($orderId, $paymentStatus, $metadata);
            break;
            
        case 'PENDING':
            // Payment is still pending
            processPendingPayment($orderId, $metadata);
            break;
            
        default:
            zp_log_error("Unknown payment status: {$paymentStatus}");
            break;
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Webhook processed successfully']);
    
} catch (Exception $e) {
    zp_log_error("Webhook processing error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Process successful payment
 */
function processSuccessfulPayment($orderId, $reference, $metadata) {
    zp_log_webhook("Processing successful payment for order: {$orderId}");
    
    // TODO: Update your database with payment success
    // TODO: Send confirmation email to customer
    // TODO: Update inventory if applicable
    // TODO: Generate invoice/receipt
    
    // Example database update (uncomment and modify as needed):
    /*
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=your_db", "username", "password");
        $stmt = $pdo->prepare("
            UPDATE orders 
            SET payment_status = 'completed', 
                payment_reference = ?, 
                updated_at = NOW() 
            WHERE order_id = ?
        ");
        $stmt->execute([$reference, $orderId]);
    } catch (PDOException $e) {
        zp_log_error("Database error processing successful payment: " . $e->getMessage());
    }
    */
    
    // Example: Send email notification
    if (!empty($metadata['customer_email'])) {
        // sendPaymentConfirmationEmail($metadata['customer_email'], $orderId, $reference);
    }
}

/**
 * Process failed payment
 */
function processFailedPayment($orderId, $paymentStatus, $metadata) {
    zp_log_webhook("Processing failed payment for order: {$orderId}, status: {$paymentStatus}");
    
    // TODO: Update your database with payment failure
    // TODO: Send failure notification to customer
    // TODO: Restore inventory if applicable
    
    // Example database update (uncomment and modify as needed):
    /*
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=your_db", "username", "password");
        $stmt = $pdo->prepare("
            UPDATE orders 
            SET payment_status = ?, 
                updated_at = NOW() 
            WHERE order_id = ?
        ");
        $stmt->execute([$paymentStatus, $orderId]);
    } catch (PDOException $e) {
        zp_log_error("Database error processing failed payment: " . $e->getMessage());
    }
    */
}

/**
 * Process pending payment
 */
function processPendingPayment($orderId, $metadata) {
    zp_log_webhook("Processing pending payment for order: {$orderId}");
    
    // TODO: Update your database with pending status
    // TODO: Send pending notification to customer if needed
    
    // Example database update (uncomment and modify as needed):
    /*
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=your_db", "username", "password");
        $stmt = $pdo->prepare("
            UPDATE orders 
            SET payment_status = 'pending', 
                updated_at = NOW() 
            WHERE order_id = ?
        ");
        $stmt->execute([$orderId]);
    } catch (PDOException $e) {
        zp_log_error("Database error processing pending payment: " . $e->getMessage());
    }
    */
}
?>
