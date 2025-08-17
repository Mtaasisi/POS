<?php
/**
 * ZenoPay Integration Example
 * 
 * This file demonstrates how to use the ZenoPay payment integration
 * in your LATS application.
 */

require_once 'zenopay-config.php';

// Example: Create a payment order
function createPaymentOrder($customerData, $amount, $metadata = []) {
    $orderData = [
        'buyer_email' => $customerData['email'],
        'buyer_name'  => $customerData['name'],
        'buyer_phone' => $customerData['phone'],
        'amount'      => $amount,
        'order_id'    => 'lats_' . uniqid(),
        'metadata'    => $metadata
    ];
    
    $ch = curl_init(ZP_BASE_URL . '/mobile_money_tanzania');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . ZP_API_KEY,
        ],
        CURLOPT_POSTFIELDS     => json_encode($orderData),
        CURLOPT_TIMEOUT        => 30,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'error' => 'Request failed'];
    }
    
    $data = json_decode($response, true);
    return $data;
}

// Example: Check payment status
function checkPaymentStatus($orderId) {
    $url = ZP_BASE_URL . '/order-status?order_id=' . urlencode($orderId);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: ' . ZP_API_KEY,
        ],
        CURLOPT_TIMEOUT        => 30,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'error' => 'Request failed'];
    }
    
    $data = json_decode($response, true);
    return $data;
}

// Example usage in your application
if (isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'create_order':
            // Example: Create a payment order for a product purchase
            $customerData = [
                'email' => $_POST['email'],
                'name'  => $_POST['name'],
                'phone' => $_POST['phone']
            ];
            
            $amount = (int)$_POST['amount'];
            $metadata = [
                'product_id' => $_POST['product_id'],
                'customer_id' => $_POST['customer_id'],
                'order_type' => 'product_purchase'
            ];
            
            $result = createPaymentOrder($customerData, $amount, $metadata);
            
            if ($result['status'] === 'success') {
                echo "✅ Payment order created successfully!\n";
                echo "Order ID: " . $result['order_id'] . "\n";
                echo "Message: " . $result['message'] . "\n";
                
                // Store order ID in your database for tracking
                // updateOrderInDatabase($result['order_id'], $metadata);
                
            } else {
                echo "❌ Error creating payment order: " . ($result['message'] ?? 'Unknown error') . "\n";
            }
            break;
            
        case 'check_status':
            // Example: Check payment status
            $orderId = $_POST['order_id'];
            $result = checkPaymentStatus($orderId);
            
            if (!empty($result['data']) && $result['result'] === 'SUCCESS') {
                foreach ($result['data'] as $order) {
                    echo "🔍 Order Status Check:\n";
                    echo "Order ID: " . $order['order_id'] . "\n";
                    echo "Status: " . $order['payment_status'] . "\n";
                    echo "Amount: " . $order['amount'] . " TZS\n";
                    echo "Reference: " . ($order['reference'] ?? 'N/A') . "\n";
                    
                    // Update your database based on status
                    // updatePaymentStatusInDatabase($order['order_id'], $order['payment_status']);
                }
            } else {
                echo "❌ Error checking status: " . ($result['message'] ?? 'Unknown error') . "\n";
            }
            break;
            
        default:
            echo "Invalid action\n";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZenoPay Integration Example</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h1>ZenoPay Payment Integration Example</h1>
    
    <h2>Create Payment Order</h2>
    <form method="POST">
        <input type="hidden" name="action" value="create_order">
        
        <div class="form-group">
            <label for="email">Customer Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label for="name">Customer Name:</label>
            <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
            <label for="phone">Phone Number (Tanzanian):</label>
            <input type="tel" id="phone" name="phone" placeholder="0744963858" required>
        </div>
        
        <div class="form-group">
            <label for="amount">Amount (TZS):</label>
            <input type="number" id="amount" name="amount" min="100" required>
        </div>
        
        <div class="form-group">
            <label for="product_id">Product ID:</label>
            <input type="text" id="product_id" name="product_id" value="PROD_001">
        </div>
        
        <div class="form-group">
            <label for="customer_id">Customer ID:</label>
            <input type="text" id="customer_id" name="customer_id" value="CUST_001">
        </div>
        
        <button type="submit">Create Payment Order</button>
    </form>
    
    <hr>
    
    <h2>Check Payment Status</h2>
    <form method="POST">
        <input type="hidden" name="action" value="check_status">
        
        <div class="form-group">
            <label for="order_id">Order ID:</label>
            <input type="text" id="order_id" name="order_id" placeholder="Enter order ID to check status">
        </div>
        
        <button type="submit">Check Status</button>
    </form>
    
    <?php if (isset($_POST['action'])): ?>
        <div class="result <?php echo (strpos($output ?? '', '✅') !== false) ? 'success' : 'error'; ?>">
            <pre><?php echo htmlspecialchars($output ?? ''); ?></pre>
        </div>
    <?php endif; ?>
    
    <hr>
    
    <h2>Integration Notes</h2>
    <ul>
        <li><strong>API Key:</strong> Your ZenoPay API key is configured in <code>zenopay-config.php</code></li>
        <li><strong>Webhook URL:</strong> Update the webhook URL in the config file to your actual domain</li>
        <li><strong>Logs:</strong> Check the <code>logs/</code> directory for error and webhook logs</li>
        <li><strong>Database Integration:</strong> Uncomment and modify the database code in the webhook handler</li>
        <li><strong>Security:</strong> Ensure your webhook endpoint is secure and validates API keys</li>
    </ul>
    
    <h3>Next Steps</h3>
    <ol>
        <li>Update the webhook URL in <code>zenopay-config.php</code> to your actual domain</li>
        <li>Configure the webhook URL in your ZenoPay dashboard</li>
        <li>Integrate the payment functions into your LATS application</li>
        <li>Set up database tables to track orders and payments</li>
        <li>Test the integration with small amounts first</li>
    </ol>
</body>
</html>
