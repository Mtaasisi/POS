<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Test the Green API proxy
$testData = [
    'path' => '/waInstance7105306911/getStateInstance',
    'method' => 'GET',
    'headers' => [
        'Authorization' => 'Bearer YOUR_API_TOKEN_HERE'
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://inauzwa.store/api/green-api-proxy');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'proxy_url' => 'https://inauzwa.store/api/green-api-proxy',
    'test_data' => $testData,
    'response_code' => $httpCode,
    'curl_error' => $error,
    'response' => $response ? json_decode($response, true) : null
];

echo json_encode($result, JSON_PRETTY_PRINT);
?>
