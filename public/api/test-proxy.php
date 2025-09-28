<?php
/**
 * Test script for Green API Proxy
 * This script tests the proxy functionality and database connectivity
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

echo json_encode([
    'status' => 'Testing Green API Proxy',
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
]);

// Test 1: Check environment variables
$tests = [];
$tests[] = [
    'name' => 'Environment Variables',
    'status' => 'checking',
    'details' => [
        'supabase_url' => getenv('VITE_SUPABASE_URL') ? 'SET' : 'NOT_SET',
        'supabase_key' => getenv('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT_SET'
    ]
];

// Test 2: Test database connection
$supabaseUrl = getenv('VITE_SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_SERVICE_ROLE_KEY');

if ($supabaseUrl && $supabaseKey) {
    $url = $supabaseUrl . '/rest/v1/whatsapp_instances';
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url . '?select=count',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    $tests[] = [
        'name' => 'Database Connection',
        'status' => $httpCode === 200 ? 'success' : 'error',
        'details' => [
            'http_code' => $httpCode,
            'error' => $error ?: 'none',
            'response' => substr($response, 0, 200)
        ]
    ];
    
    // Test 3: Get specific instance
    if ($httpCode === 200) {
        $instanceId = '7105306911'; // Your instance ID
        $url = $supabaseUrl . '/rest/v1/whatsapp_instances';
        $queryParams = http_build_query([
            'instance_id' => 'eq.' . $instanceId,
            'select' => 'instance_id,api_token,green_api_host'
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
        curl_close($ch);
        
        $data = json_decode($response, true);
        
        $tests[] = [
            'name' => 'Instance Lookup',
            'status' => !empty($data) ? 'success' : 'error',
            'details' => [
                'instance_id' => $instanceId,
                'found' => !empty($data),
                'count' => count($data),
                'http_code' => $httpCode
            ]
        ];
        
        // Test 4: Test Green API connection
        if (!empty($data)) {
            $instance = $data[0];
            $apiToken = $instance['api_token'];
            $apiUrl = $instance['green_api_host'] ?: 'https://api.green-api.com';
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $apiUrl . '/waInstance' . $instanceId . '/getStateInstance',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $apiToken,
                    'Content-Type: application/json'
                ],
                CURLOPT_TIMEOUT => 10
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            $tests[] = [
                'name' => 'Green API Connection',
                'status' => $httpCode === 200 ? 'success' : 'error',
                'details' => [
                    'http_code' => $httpCode,
                    'error' => $error ?: 'none',
                    'response' => substr($response, 0, 200),
                    'api_url' => $apiUrl
                ]
            ];
        }
    }
} else {
    $tests[] = [
        'name' => 'Database Connection',
        'status' => 'error',
        'details' => [
            'error' => 'Missing Supabase credentials'
        ]
    ];
}

echo json_encode([
    'status' => 'Test completed',
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => $tests
], JSON_PRETTY_PRINT);
?>
