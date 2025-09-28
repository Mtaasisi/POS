-- Fix SMS Settings Constraint Issue
-- This script ensures the settings table has the proper unique constraint

-- First, check if the unique constraint exists and add it if it doesn't
DO $$
BEGIN
    -- Check if the unique constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'settings_key_key' 
        AND conrelid = 'settings'::regclass
    ) THEN
        -- Add the unique constraint
        ALTER TABLE settings ADD CONSTRAINT settings_key_key UNIQUE (key);
        RAISE NOTICE '✅ Added unique constraint to settings.key';
    ELSE
        RAISE NOTICE '✅ Unique constraint already exists on settings.key';
    END IF;
END $$;

-- Now insert/update the SMS settings safely
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'your_mobishastra_api_key_here'),
('sms_api_url', 'https://mshastra.com/sendurl.aspx'),
('sms_price', '15')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Verify the settings were inserted/updated correctly
SELECT 
    key,
    CASE 
        WHEN key = 'sms_provider_api_key' AND value = 'your_mobishastra_api_key_here' 
        THEN '❌ Please update with your real API key'
        WHEN key = 'sms_provider_api_key' 
        THEN '✅ API Key configured'
        ELSE value 
    END as value,
    updated_at
FROM settings 
WHERE key LIKE 'sms_%'
ORDER BY key;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ SMS settings configuration complete!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Update sms_provider_api_key with your actual Mobishastra API key';
    RAISE NOTICE '   2. Test SMS functionality in your application';
    RAISE NOTICE '   3. Use test phone number 255700000000 for testing';
END $$;
