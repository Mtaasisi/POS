-- SMS Configuration Script
-- Run this script to configure your SMS provider settings

-- Update SMS provider settings with your actual credentials
-- Replace 'your_actual_api_key_here' with your real Mobishastra API key

UPDATE settings 
SET value = 'your_actual_api_key_here'
WHERE key = 'sms_provider_api_key';

-- Verify the settings
SELECT 
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' AND value = 'your_actual_api_key_here' 
        THEN '❌ Please update with your real API key'
        WHEN key = 'sms_provider_api_key' 
        THEN '✅ API Key configured'
        ELSE value 
    END as value,
    updated_at
FROM settings 
WHERE key LIKE 'sms_%'
ORDER BY key;

-- Instructions:
-- 1. Replace 'your_actual_api_key_here' with your real Mobishastra API key
-- 2. Run this script in your Supabase SQL editor
-- 3. Test SMS functionality from your application
-- 4. Check the SMS logs to verify successful sending

-- For testing, you can use phone number: 255700000000
-- This will simulate a successful SMS without actually sending it
