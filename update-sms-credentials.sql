-- Update SMS Credentials with Actual MobiShastra Values
-- This will fix the "Invalid Profile Id" error

-- Update the API Key (Profile ID)
UPDATE settings 
SET value = 'Inauzwa', updated_at = NOW()
WHERE key = 'sms_provider_api_key';

-- Add/Update the Password
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_provider_password', '@Masika10', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = '@Masika10',
    updated_at = NOW();

-- Verify the updates
SELECT 
    'Updated SMS Credentials:' as info,
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' THEN '✅ Profile ID: ' || value
        WHEN key = 'sms_provider_password' THEN '✅ Password: ' || value
        WHEN key = 'sms_api_url' THEN '✅ URL: ' || value
        ELSE value 
    END as value,
    updated_at
FROM settings 
WHERE key IN ('sms_provider_api_key', 'sms_provider_password', 'sms_api_url')
ORDER BY key;
