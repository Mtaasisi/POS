<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Load configuration file
    require_once __DIR__ . '/config.php';
    
    echo json_encode([
        'status' => 'Debug started',
        'step' => 'Config loaded',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Get request details
    $method = $_SERVER['REQUEST_METHOD'];
    $requestPath = $_SERVER['REQUEST_URI'];
    $pathParts = explode('/api/debug-proxy.php', $requestPath);
    $endpoint = $pathParts[1] ?? '';
    
    echo json_encode([
        'status' => 'Request parsed',
        'method' => $method,
        'endpoint' => $endpoint,
        'full_path' => $requestPath
    ]);
    
    // Extract instance ID
    preg_match('/\/waInstance(\d+)\//', $endpoint, $matches);
    $instanceId = $matches[1] ?? null;
    
    echo json_encode([
        'status' => 'Instance ID extracted',
        'instance_id' => $instanceId,
        'matches' => $matches
    ]);
    
    if (!$instanceId) {
        throw new Exception('Could not extract instance ID from endpoint');
    }
    
    // Check environment variables
    $supabaseUrl = getenv('VITE_SUPABASE_URL');
    $supabaseKey = getenv('SUPABASE_SERVICE_ROLE_KEY');
    
    echo json_encode([
        'status' => 'Environment checked',
        'supabase_url' => $supabaseUrl ? 'SET' : 'NOT_SET',
        'supabase_key' => $supabaseKey ? 'SET' : 'NOT_SET'
    ]);
    
    if (!$supabaseUrl || !$supabaseKey) {
        throw new Exception('Supabase credentials not configured');
    }
    
    // Query database for instance
    $url = $supabaseUrl . '/rest/v1/whatsapp_instances';
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json'
    ];
    
    $queryParams = http_build_query([
        'instance_id' => 'eq.' . $instanceId,
        'select' => 'instance_id,api_token,green_api_host'
    ]);
    
    echo json_encode([
        'status' => 'Database query prepared',
        'url' => $url . '?' . $queryParams
    ]);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url . '?' . $queryParams,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo json_encode([
        'status' => 'Database query executed',
        'http_code' => $httpCode,
        'curl_error' => $error ?: 'none',
        'response_length' => strlen($response)
    ]);
    
    if ($error) {
        throw new Exception('cURL error: ' . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('Database query failed with HTTP ' . $httpCode . ': ' . $response);
    }
    
    $data = json_decode($response, true);
    
    echo json_encode([
        'status' => 'Response parsed',
        'data_count' => count($data),
        'data' => $data
    ]);
    
    if (empty($data)) {
        throw new Exception("No instance found with ID: $instanceId");
    }
    
    $instance = $data[0];
    $apiToken = $instance['api_token'];
    $apiUrl = $instance['green_api_host'] ?: 'https://api.green-api.com';
    
    echo json_encode([
        'status' => 'Instance found',
        'api_token' => $apiToken ? 'SET' : 'NOT_SET',
        'api_url' => $apiUrl
    ]);
    
    // Success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Debug completed successfully',
        'instance' => [
            'id' => $instance['instance_id'],
            'api_url' => $apiUrl,
            'token_set' => !empty($apiToken)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
