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

// Only allow POST requests for SMS sending
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Only POST requests are supported.']);
    exit();
}

try {
    // Get the request data
    $input = file_get_contents('php://input');
    error_log("📥 Raw input: " . $input);
    
    $request = json_decode($input, true);
    
    if (!$request) {
        error_log("❌ Invalid JSON data received");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data', 'raw_input' => $input]);
        exit();
    }
    
    // Validate required fields
    $requiredFields = ['phone', 'message', 'apiUrl', 'apiKey'];
    foreach ($requiredFields as $field) {
        if (!isset($request[$field]) || empty($request[$field])) {
            error_log("❌ Missing required field: $field");
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field", 'received_fields' => array_keys($request)]);
            exit();
        }
    }
    
    $phone = $request['phone'];
    $message = $request['message'];
    $apiUrl = $request['apiUrl'];
    $apiKey = $request['apiKey'];
    $apiPassword = $request['apiPassword'] ?? $apiKey; // Use password if provided, fallback to apiKey
    $senderId = $request['senderId'] ?? 'LATS CHANCE';
    
    // Additional validation for null/empty values
    if (is_null($apiKey) || $apiKey === 'null' || $apiKey === '') {
        error_log("❌ API Key is null or empty");
        http_response_code(400);
        echo json_encode(['error' => 'SMS API Key is not configured. Please configure SMS settings first.']);
        exit();
    }
    
    if (is_null($apiUrl) || $apiUrl === 'null' || $apiUrl === '') {
        error_log("❌ API URL is null or empty");
        http_response_code(400);
        echo json_encode(['error' => 'SMS API URL is not configured. Please configure SMS settings first.']);
        exit();
    }
    
    // Log the request (for debugging)
    error_log("📱 SMS Proxy Request:");
    error_log("   Phone: $phone");
    error_log("   Message: " . substr($message, 0, 100) . "...");
    error_log("   API URL: $apiUrl");
    error_log("   Sender ID: $senderId");
    
    // For testing purposes, if using a test phone number, simulate success
    if ($phone === '255700000000' || strpos($phone, '255700') === 0) {
        error_log("🧪 Test SMS - simulating success for phone: $phone");
        echo json_encode([
            'success' => true,
            'status' => 200,
            'data' => [
                'message' => 'Test SMS simulated successfully',
                'phone' => $phone,
                'test_mode' => true
            ]
        ]);
        exit();
    }
    
    // Prepare the SMS request based on the provider
    $providerData = prepareSMSRequest($apiUrl, $phone, $message, $apiKey, $senderId);
    
    // Make the SMS request using cURL
    $ch = curl_init();
    
    // Set basic cURL options
    curl_setopt($ch, CURLOPT_URL, $providerData['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $providerData['method']);
    
    // Set headers
    $headers = $providerData['headers'];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // Add body if needed
    if (!empty($providerData['body'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $providerData['body']);
    }
    
    // Log the request details
    error_log("🌐 SMS Provider Request:");
    error_log("   URL: " . $providerData['url']);
    error_log("   Method: " . $providerData['method']);
    error_log("   Headers: " . json_encode($headers));
    error_log("   Body: " . $providerData['body']);
    
    // Make the request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    // Log the response
    error_log("✅ SMS Provider Response:");
    error_log("   Status: $httpCode");
    error_log("   Response: " . substr($response, 0, 500));
    
    // Parse response based on provider
    $responseData = parseSMSResponse($apiUrl, $response, $httpCode);
    
    // Return the response
    http_response_code($httpCode);
    echo json_encode([
        'success' => $responseData['success'],
        'status' => $httpCode,
        'data' => $responseData['data'],
        'error' => $responseData['error'] ?? null
    ]);
    
} catch (Exception $e) {
    error_log("❌ SMS Proxy error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Prepare SMS request data based on the provider
 */
function prepareSMSRequest($apiUrl, $phone, $message, $apiKey, $senderId) {
    // Detect provider based on URL
    if (strpos($apiUrl, 'mshastra.com') !== false) {
        // Mobishastra provider - uses GET request with query parameters
        $queryParams = [
            'user' => $apiKey,
            'pwd' => $apiKey, // Mobishastra uses same value for both user and pwd
            'senderid' => $senderId,
            'mobileno' => $phone,
            'msgtext' => $message,
            'priority' => 'High',
            'CountryCode' => 'ALL'
        ];
        
        $fullUrl = $apiUrl . '?' . http_build_query($queryParams);
        
        return [
            'url' => $fullUrl,
            'method' => 'GET',
            'headers' => [
                'User-Agent: LATS-CHANCE-SMS-Proxy/1.0'
            ],
            'body' => '' // GET request doesn't need body
        ];
    } elseif (strpos($apiUrl, 'smstanzania.com') !== false) {
        // SMS Tanzania provider
        return [
            'url' => $apiUrl,
            'method' => 'POST',
            'headers' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
                'User-Agent: LATS-CHANCE-SMS-Proxy/1.0'
            ],
            'body' => json_encode([
                'to' => $phone,
                'message' => $message,
                'sender_id' => $senderId
            ])
        ];
    } elseif (strpos($apiUrl, 'bulksms.com') !== false) {
        // BulkSMS provider
        return [
            'url' => $apiUrl,
            'method' => 'POST',
            'headers' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
                'User-Agent: LATS-CHANCE-SMS-Proxy/1.0'
            ],
            'body' => json_encode([
                'to' => $phone,
                'message' => $message,
                'sender_id' => $senderId
            ])
        ];
    } else {
        // Generic provider (default format)
        return [
            'url' => $apiUrl,
            'method' => 'POST',
            'headers' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
                'User-Agent: LATS-CHANCE-SMS-Proxy/1.0'
            ],
            'body' => json_encode([
                'phone' => $phone,
                'message' => $message,
                'sender_id' => $senderId
            ])
        ];
    }
}

/**
 * Parse SMS response based on the provider
 */
function parseSMSResponse($apiUrl, $response, $httpCode) {
    // Detect provider based on URL
    if (strpos($apiUrl, 'mshastra.com') !== false) {
        // Mobishastra returns simple text responses
        $response = trim($response);
        
        // Check for success indicators
        if (strpos($response, 'Send Successful') !== false || 
            strpos($response, '000') !== false) {
            return [
                'success' => true,
                'data' => [
                    'message' => 'SMS sent successfully',
                    'provider_response' => $response,
                    'status_code' => '000'
                ]
            ];
        } else {
            // Handle error responses
            $errorMessage = 'SMS sending failed';
            if (strpos($response, 'Invalid Mobile No') !== false) {
                $errorMessage = 'Invalid mobile number';
            } elseif (strpos($response, 'Invalid Password') !== false) {
                $errorMessage = 'Invalid API credentials';
            } elseif (strpos($response, 'No More Credits') !== false) {
                $errorMessage = 'Insufficient account balance';
            } elseif (strpos($response, 'Profile Id Blocked') !== false) {
                $errorMessage = 'Account is blocked';
            }
            
            return [
                'success' => false,
                'data' => null,
                'error' => $errorMessage . ': ' . $response
            ];
        }
    } else {
        // For JSON-based providers
        $responseData = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $responseData = ['rawResponse' => $response];
        }
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'data' => $responseData
            ];
        } else {
            return [
                'success' => false,
                'data' => $responseData,
                'error' => 'SMS sending failed'
            ];
        }
    }
}
?>
