-- Update SMS API Key with Your Actual Mobishastra Credentials
-- Replace 'YOUR_ACTUAL_MOBISHASTRA_API_KEY' with your real API key

UPDATE settings 
SET value = 'YOUR_ACTUAL_MOBISHASTRA_API_KEY'
WHERE key = 'sms_provider_api_key';

-- Verify the update
SELECT 
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' AND value = 'YOUR_ACTUAL_MOBISHASTRA_API_KEY' 
        THEN '❌ Please replace with your real API key'
        WHEN key = 'sms_provider_api_key' 
        THEN '✅ API Key configured: ' || LEFT(value, 8) || '...'
        ELSE value 
    END as value,
    updated_at
FROM settings 
WHERE key LIKE 'sms_%'
ORDER BY key;

-- Show current SMS configuration status
DO $$
DECLARE
    api_key_set BOOLEAN;
    api_url_set BOOLEAN;
    price_set BOOLEAN;
BEGIN
    -- Check if all required settings are configured
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_provider_api_key') != 'YOUR_ACTUAL_MOBISHASTRA_API_KEY' AND
        (SELECT value FROM settings WHERE key = 'sms_provider_api_key') IS NOT NULL
    INTO api_key_set;
    
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_api_url') IS NOT NULL
    INTO api_url_set;
    
    SELECT 
        (SELECT value FROM settings WHERE key = 'sms_price') IS NOT NULL
    INTO price_set;
    
    RAISE NOTICE '📱 SMS Configuration Status:';
    RAISE NOTICE '   API Key: %', CASE WHEN api_key_set THEN '✅ Configured' ELSE '❌ Needs Setup' END;
    RAISE NOTICE '   API URL: %', CASE WHEN api_url_set THEN '✅ Configured' ELSE '❌ Missing' END;
    RAISE NOTICE '   Price: %', CASE WHEN price_set THEN '✅ Configured' ELSE '❌ Missing' END;
    
    IF api_key_set AND api_url_set AND price_set THEN
        RAISE NOTICE '🎉 SMS system is ready to use!';
        RAISE NOTICE '💡 Test with phone number: 255700000000';
    ELSE
        RAISE NOTICE '⚠️ Please complete the configuration above';
    END IF;
END $$;
