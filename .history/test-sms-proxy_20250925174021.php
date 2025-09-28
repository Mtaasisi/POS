<?php
// Test SMS Proxy Functionality
// This script tests the SMS proxy endpoint directly

echo "🧪 Testing SMS Proxy Endpoint\n";
echo "============================\n\n";

// Test data
$testData = [
    'phone' => '255700000000', // Test phone number
    'message' => 'Test SMS from LATS CHANCE',
    'apiUrl' => 'https://mshastra.com/sendurl.aspx',
    'apiKey' => 'Inauzwa',
    'senderId' => 'INAUZWA'
];

// Make request to SMS proxy
$url = 'http://localhost:8000/api/sms-proxy.php';
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: SMS-Proxy-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

echo "📡 Making request to: $url\n";
echo "📦 Request data: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "📊 Response Status: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    echo "📄 Response Body:\n";
    echo $response . "\n\n";
    
    // Try to parse JSON response
    $responseData = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ Valid JSON response\n";
        echo "📋 Parsed response:\n";
        echo json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "❌ Invalid JSON response\n";
        echo "🔍 JSON Error: " . json_last_error_msg() . "\n";
    }
}

echo "\n🎯 Test completed!\n";
?>
