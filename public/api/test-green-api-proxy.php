<?php
header('Content-Type: application/json');

// Test the Green API proxy
$testUrl = 'http://' . $_SERVER['HTTP_HOST'] . '/api/green-api-proxy.php/waInstance7105306911/getStateInstance';

echo "Testing Green API Proxy...\n";
echo "Test URL: " . $testUrl . "\n\n";

// Make a test request
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $testUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";

if ($error) {
    echo "cURL Error: " . $error . "\n";
}

// Check environment variables
echo "\nEnvironment Variables:\n";
echo "GREENAPI_INSTANCE_ID: " . (getenv('GREENAPI_INSTANCE_ID') ?: 'NOT_SET') . "\n";
echo "GREENAPI_API_TOKEN: " . (getenv('GREENAPI_API_TOKEN') ?: 'NOT_SET') . "\n";
echo "GREENAPI_API_URL: " . (getenv('GREENAPI_API_URL') ?: 'NOT_SET') . "\n";
?>
