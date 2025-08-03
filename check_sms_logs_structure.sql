-- Check SMS Logs Table Structure
-- This script will help identify what's causing the 400 Bad Request error

-- Check if sms_logs table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'sms_logs';

-- Check sms_logs table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'sms_logs'
ORDER BY ordinal_position;

-- Check RLS policies on sms_logs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'sms_logs'
ORDER BY policyname;

-- Check if RLS is enabled on sms_logs
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'sms_logs';

-- Check for any constraints on sms_logs
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.sms_logs'::regclass;

-- Check sample data from sms_logs (if any)
SELECT 
    id,
    phone_number,
    message,
    status,
    cost,
    created_at,
    sent_by,
    device_id,
    sent_at,
    error_message
FROM sms_logs 
LIMIT 5; 