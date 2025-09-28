-- Add SMS Provider Password
INSERT INTO settings (key, value, updated_at) 
VALUES ('sms_provider_password', '@Masika10', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Verify the password was added
SELECT key, value, updated_at 
FROM settings 
WHERE key = 'sms_provider_password';
