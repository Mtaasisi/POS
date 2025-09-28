<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests for SMS testing
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Only POST requests are supported.']);
    exit();
}

try {
    // Get the request data
    $input = file_get_contents('php://input');
    $request = json_decode($input, true);
    
    if (!$request) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit();
    }
    
    // Validate required fields
    $phone = $request['phone'] ?? null;
    $message = $request['message'] ?? null;
    
    if (!$phone || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: phone and message']);
        exit();
    }
    
    // For testing purposes, simulate SMS sending
    error_log("🧪 SMS Test Request:");
    error_log("   Phone: $phone");
    error_log("   Message: " . substr($message, 0, 100) . "...");
    
    // Simulate a successful SMS test
    if ($phone === '255700000000' || strpos($phone, '255700') === 0) {
        echo json_encode([
            'success' => true,
            'message' => 'SMS test successful! This is a simulated response.',
            'phone' => $phone,
            'test_mode' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    // For real phone numbers, you could integrate with the actual SMS service
    // For now, return a success response for testing
    echo json_encode([
        'success' => true,
        'message' => 'SMS test completed successfully',
        'phone' => $phone,
        'test_mode' => true,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("❌ SMS Test error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
