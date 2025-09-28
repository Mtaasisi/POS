-- Setup MobiShastra Credentials for LATS CHANCE
-- Using your actual credentials from MobiShastra account

-- Update SMS provider API key with your actual Profile ID
UPDATE settings 
SET value = 'Inauzwa'
WHERE key = 'sms_provider_api_key';

-- Verify the configuration
SELECT 
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' 
        THEN '✅ Configured: ' || value
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
