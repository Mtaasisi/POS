<?php
header('Content-Type: application/json');

// Test 1: Check if config.php exists and can be loaded
$configPath = __DIR__ . '/config.php';
$configExists = file_exists($configPath);

echo "Config file exists: " . ($configExists ? 'YES' : 'NO') . "\n";
echo "Config path: $configPath\n\n";

if ($configExists) {
    // Test 2: Load the config file
    echo "Loading config file...\n";
    require_once $configPath;
    echo "Config file loaded successfully\n\n";
    
    // Test 3: Check environment variables
    echo "Environment variables after loading config:\n";
    $instanceId = getenv('GREENAPI_INSTANCE_ID');
    $apiToken = getenv('GREENAPI_API_TOKEN');
    $apiUrl = getenv('GREENAPI_API_URL');
    $supabaseUrl = getenv('VITE_SUPABASE_URL');
    
    echo "GREENAPI_INSTANCE_ID: " . ($instanceId ?: 'NOT_SET') . "\n";
    echo "GREENAPI_API_TOKEN: " . ($apiToken ? (substr($apiToken, 0, 10) . '...' . substr($apiToken, -10)) : 'NOT_SET') . "\n";
    echo "GREENAPI_API_URL: " . ($apiUrl ?: 'NOT_SET') . "\n";
    echo "VITE_SUPABASE_URL: " . ($supabaseUrl ?: 'NOT_SET') . "\n";
    
    // Test 4: Try to set environment variables manually
    echo "\nTrying to set environment variables manually...\n";
    putenv('GREENAPI_INSTANCE_ID=7105284900');
    putenv('GREENAPI_API_TOKEN=b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294');
    putenv('GREENAPI_API_URL=https://7105.api.greenapi.com');
    
    $instanceId2 = getenv('GREENAPI_INSTANCE_ID');
    $apiToken2 = getenv('GREENAPI_API_TOKEN');
    $apiUrl2 = getenv('GREENAPI_API_URL');
    
    echo "After manual setting:\n";
    echo "GREENAPI_INSTANCE_ID: " . ($instanceId2 ?: 'NOT_SET') . "\n";
    echo "GREENAPI_API_TOKEN: " . ($apiToken2 ? (substr($apiToken2, 0, 10) . '...' . substr($apiToken2, -10)) : 'NOT_SET') . "\n";
    echo "GREENAPI_API_URL: " . ($apiUrl2 ?: 'NOT_SET') . "\n";
} else {
    echo "Config file not found!\n";
}
?>
