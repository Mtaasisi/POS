<?php
/**
 * Secure Configuration file for WhatsApp Hub
 * This file uses environment variables for sensitive data
 */

// Get credentials from environment variables (more secure)
$greenApiInstanceId = getenv('GREENAPI_INSTANCE_ID') ?: '7105284900';
$greenApiToken = getenv('GREENAPI_API_TOKEN') ?: 'your_green_api_token_here';
$greenApiUrl = getenv('GREENAPI_API_URL') ?: 'https://7105.api.greenapi.com';

$supabaseUrl = getenv('VITE_SUPABASE_URL') ?: 'https://jxhzveborezjhsmzsgbc.supabase.co';
$supabaseServiceKey = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: 'your_service_role_key_here';

// Set WhatsApp credentials from environment variables
putenv("GREENAPI_INSTANCE_ID={$greenApiInstanceId}");
putenv("GREENAPI_API_TOKEN={$greenApiToken}");
putenv("GREENAPI_API_URL={$greenApiUrl}");

// Set Supabase credentials from environment variables
putenv("VITE_SUPABASE_URL={$supabaseUrl}");
putenv("SUPABASE_SERVICE_ROLE_KEY={$supabaseServiceKey}");

// Set other environment variables
putenv('APP_ENV=production');
putenv('DEBUG_MODE=false');
putenv('DEBUG_LOGGING=false');
putenv('DEBUG_WEBHOOK=false');

// Log that config was loaded (without sensitive data)
error_log("WhatsApp config: Configuration loaded successfully from environment variables");
?>
