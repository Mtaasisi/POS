-- Fix SMS Configuration for LATS CHANCE
-- This script ensures the SMS settings are properly configured

-- First, check current SMS settings
SELECT 
    'Current SMS Settings:' as info,
    key,
    value,
    updated_at
FROM settings 
WHERE key LIKE 'sms_%'
ORDER BY key;

-- Insert or update SMS provider API key (MobiShastra Profile ID)
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_provider_api_key', 'Inauzwa', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Insert or update SMS API URL (MobiShastra endpoint)
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_api_url', 'https://mshastra.com/sendurl.aspx', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Insert or update SMS price
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_price', '15', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Insert or update SMS password (MobiShastra specific)
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_provider_password', '@Masika10', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Verify the configuration
SELECT 
    'Updated SMS Settings:' as info,
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' AND value = 'Inauzwa' THEN '✅ Configured: ' || value
        WHEN key = 'sms_api_url' AND value = 'https://mshastra.com/sendurl.aspx' THEN '✅ Configured: ' || value
        WHEN key = 'sms_price' AND value = '15' THEN '✅ Configured: ' || value
        ELSE value 
    END as value,
    updated_at
FROM settings 
WHERE key LIKE 'sms_%'
ORDER BY key;

-- Show configuration status
DO $$
DECLARE
    api_key_set BOOLEAN;
    api_url_set BOOLEAN;
    price_set BOOLEAN;
BEGIN
    -- Check if all required settings are configured
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_provider_api_key') IS NOT NULL
    INTO api_key_set;
    
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_api_url') IS NOT NULL
    INTO api_url_set;
    
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_price') IS NOT NULL
    INTO price_set;
    
    RAISE NOTICE '📱 MobiShastra SMS Configuration Status:';
    RAISE NOTICE '   Profile ID: %', CASE WHEN api_key_set THEN '✅ Configured (Inauzwa)' ELSE '❌ Missing' END;
    RAISE NOTICE '   Password: %', '✅ Set (@Masika10)';
    RAISE NOTICE '   Sender ID: %', '✅ Set (INAUZWA)';
    RAISE NOTICE '   API URL: %', CASE WHEN api_url_set THEN '✅ Configured' ELSE '❌ Missing' END;
    RAISE NOTICE '   Price: %', CASE WHEN price_set THEN '✅ Configured' ELSE '❌ Missing' END;
    
    IF api_key_set AND api_url_set AND price_set THEN
        RAISE NOTICE '🎉 MobiShastra SMS system is ready to use!';
        RAISE NOTICE '💡 Test with phone number: 255700000000 (test mode)';
        RAISE NOTICE '📱 Real SMS: Use numbers like 255123456789';
    ELSE
        RAISE NOTICE '⚠️ Please complete the configuration above';
    END IF;
END $$;
