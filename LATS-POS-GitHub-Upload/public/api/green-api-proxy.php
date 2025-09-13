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

// Allow both GET and POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $baseUrl = 'https://api.green-api.com';
    
    // Handle GET requests with URL path parameters
    if ($method === 'GET') {
        // Parse the URL path to extract instance ID, action, and token
        $requestUri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', trim($requestUri, '/'));
        
        // Find the green-api-proxy.php part and extract the remaining path
        $proxyIndex = array_search('green-api-proxy.php', $pathParts);
        if ($proxyIndex !== false && isset($pathParts[$proxyIndex + 1])) {
            // Extract the remaining path after green-api-proxy.php
            $apiPath = implode('/', array_slice($pathParts, $proxyIndex + 1));
            
            // Parse the path: waInstance{instanceId}/{action}/{token}
            if (preg_match('/^waInstance([^\/]+)\/([^\/]+)\/(.+)$/', $apiPath, $matches)) {
                $instanceId = $matches[1];
                $action = $matches[2];
                $token = $matches[3];
                
                // Construct the Green API URL
                $url = $baseUrl . "/waInstance{$instanceId}/{$action}/{$token}";
            } else {
                throw new Exception("Invalid URL format. Expected: waInstance{instanceId}/{action}/{token}");
            }
        } else {
            throw new Exception("Invalid URL structure");
        }
    } else {
        // Handle POST requests (existing logic)
        $input = file_get_contents('php://input');
        $request = json_decode($input, true);
        
        if (!$request || !isset($request['path'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Path is required']);
            exit();
        }
        
        $path = $request['path'];
        $body = $request['body'] ?? null;
        $headers = $request['headers'] ?? [];
        $baseUrl = $request['baseUrl'] ?? 'https://api.green-api.com';
        
        // Construct the full URL
        $url = $baseUrl . $path;
    }
    
    // Prepare cURL request
    $ch = curl_init();
    
    // Set basic cURL options
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    // Set method
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    // Set headers
    $curlHeaders = [
        'Content-Type: application/json',
        'User-Agent: LATS-CHANCE-GreenAPI-Proxy/1.0'
    ];
    
    // Add custom headers for POST requests
    if ($method === 'POST' && isset($headers)) {
        foreach ($headers as $key => $value) {
            $curlHeaders[] = "$key: $value";
        }
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
    
    // Add body for POST requests
    if ($method === 'POST' && isset($body) && ($body !== null)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    
    // Log the request (for debugging)
    error_log("🌐 Proxying request to: $url");
    error_log("📋 Method: $method");
    error_log("📦 Headers: " . json_encode($curlHeaders));
    
    // Make the request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    // Parse response
    $responseData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $responseData = ['rawResponse' => $response];
    }
    
    // Log the response (for debugging)
    error_log("✅ Response status: $httpCode");
    error_log("📄 Response data: " . json_encode($responseData));
    
    // Return the response
    http_response_code($httpCode);
    echo json_encode([
        'success' => $httpCode >= 200 && $httpCode < 300,
        'status' => $httpCode,
        'data' => $responseData
    ]);
    
} catch (Exception $e) {
    error_log("❌ Proxy error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
