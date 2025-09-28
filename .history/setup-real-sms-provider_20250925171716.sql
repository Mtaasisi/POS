-- Setup Real SMS Provider Credentials
-- Replace the placeholder values with your actual SMS provider credentials

-- For Mobishastra (Tanzania SMS Provider)
-- Get credentials from: https://mshastra.com/
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'YOUR_MOBISHASTRA_API_KEY_HERE'),
('sms_api_url', 'https://mshastra.com/sendurl.aspx'),
('sms_price', '15')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Alternative: For SMS Tanzania
-- Uncomment and use this instead if you're using SMS Tanzania
-- INSERT INTO settings (key, value) VALUES 
-- ('sms_provider_api_key', 'YOUR_SMS_TANZANIA_API_KEY_HERE'),
-- ('sms_api_url', 'https://api.smstanzania.com/send'),
-- ('sms_price', '15')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Alternative: For BulkSMS
-- Uncomment and use this instead if you're using BulkSMS
-- INSERT INTO settings (key, value) VALUES 
-- ('sms_provider_api_key', 'YOUR_BULKSMS_API_KEY_HERE'),
-- ('sms_api_url', 'https://api.bulksms.com/send'),
-- ('sms_price', '15')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify the settings
SELECT 
    key, 
    CASE 
        WHEN key = 'sms_provider_api_key' THEN 
            CASE 
                WHEN value = 'YOUR_MOBISHASTRA_API_KEY_HERE' THEN '❌ NOT CONFIGURED - Replace with real API key'
                ELSE '✅ Configured: ' || LEFT(value, 10) || '...'
            END
        ELSE '✅ ' || value
    END as status
FROM settings 
WHERE key IN ('sms_provider_api_key', 'sms_api_url', 'sms_price')
ORDER BY key;

-- Instructions
SELECT 'IMPORTANT: Replace YOUR_MOBISHASTRA_API_KEY_HERE with your actual API key from your SMS provider!' as instruction;
