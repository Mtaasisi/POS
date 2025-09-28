<?php
/**
 * Test Configuration Loading
 */

// Load configuration from config.php file
$configLoaded = false;
$configPaths = [
    __DIR__ . '/config.php',
    __DIR__ . '/../config.php',
    __DIR__ . '/../../config.php'
];

foreach ($configPaths as $configPath) {
    if (file_exists($configPath)) {
        require_once $configPath;
        $configLoaded = true;
        echo "✅ Loaded config from: $configPath\n";
        break;
    }
}

if (!$configLoaded) {
    echo "❌ No config file found\n";
    exit(1);
}

// Test environment variables
$instanceId = getenv('GREENAPI_INSTANCE_ID');
$apiToken = getenv('GREENAPI_API_TOKEN');
$apiUrl = getenv('GREENAPI_API_URL');
$supabaseUrl = getenv('VITE_SUPABASE_URL');

echo "Environment Variables:\n";
echo "  GREENAPI_INSTANCE_ID: " . ($instanceId ?: 'NOT_SET') . "\n";
echo "  GREENAPI_API_TOKEN: " . ($apiToken ? (substr($apiToken, 0, 10) . '...' . substr($apiToken, -10)) : 'NOT_SET') . "\n";
echo "  GREENAPI_API_URL: " . ($apiUrl ?: 'NOT_SET') . "\n";
echo "  VITE_SUPABASE_URL: " . ($supabaseUrl ?: 'NOT_SET') . "\n";

if ($instanceId && $apiToken && $apiUrl) {
    echo "✅ WhatsApp credentials are configured\n";
} else {
    echo "❌ WhatsApp credentials are not properly configured\n";
}
?>
