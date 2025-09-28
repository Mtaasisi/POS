-- Create SMS Settings in Database
-- This script creates the SMS provider credentials in your database

-- Insert SMS provider settings
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'test_api_key_123'),
('sms_api_url', 'https://httpbin.org/post'),
('sms_price', '15')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify the settings were created/updated
SELECT 
    key, 
    value, 
    created_at, 
    updated_at 
FROM settings 
WHERE key IN ('sms_provider_api_key', 'sms_api_url', 'sms_price')
ORDER BY key;

-- Success message
SELECT 'SMS settings created successfully! Your SMS system is now configured.' as status;
