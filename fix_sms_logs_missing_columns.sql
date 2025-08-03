-- Fix SMS Logs Missing Columns
-- Add missing columns that the SMS service is trying to update

-- Add sent_at column
ALTER TABLE sms_logs 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Add error_message column  
ALTER TABLE sms_logs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Verify the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'sms_logs'
ORDER BY ordinal_position; 