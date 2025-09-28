-- SMS Database Relations Check
-- This script checks all SMS-related tables and their relationships

-- Check if SMS-related tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('sms_logs', 'sms_templates', 'sms_triggers', 'sms_trigger_logs', 'settings') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sms_logs', 'sms_templates', 'sms_triggers', 'sms_trigger_logs', 'settings')
ORDER BY table_name;

-- Check SMS logs table structure
SELECT 
    'sms_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sms_logs'
ORDER BY ordinal_position;

-- Check SMS templates table structure
SELECT 
    'sms_templates' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sms_templates'
ORDER BY ordinal_position;

-- Check SMS triggers table structure
SELECT 
    'sms_triggers' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sms_triggers'
ORDER BY ordinal_position;

-- Check SMS trigger logs table structure
SELECT 
    'sms_trigger_logs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sms_trigger_logs'
ORDER BY ordinal_position;

-- Check settings table structure
SELECT 
    'settings' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
ORDER BY ordinal_position;

-- Check foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('sms_logs', 'sms_templates', 'sms_triggers', 'sms_trigger_logs')
ORDER BY tc.table_name, kcu.column_name;

-- Check indexes on SMS tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('sms_logs', 'sms_templates', 'sms_triggers', 'sms_trigger_logs')
ORDER BY tablename, indexname;

-- Check RLS policies
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
AND tablename IN ('sms_logs', 'sms_templates', 'sms_triggers', 'sms_trigger_logs')
ORDER BY tablename, policyname;

-- Check current SMS settings
SELECT 
    key,
    value,
    created_at,
    updated_at
FROM settings 
WHERE key IN ('sms_provider_api_key', 'sms_api_url', 'sms_price')
ORDER BY key;

-- Check SMS templates count
SELECT 
    COUNT(*) as template_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_templates
FROM sms_templates;

-- Check SMS logs count and status distribution
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM sms_logs;

-- Check SMS triggers count
SELECT 
    COUNT(*) as total_triggers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_triggers
FROM sms_triggers;

-- Check SMS trigger logs count
SELECT 
    COUNT(*) as total_trigger_logs,
    COUNT(CASE WHEN result = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN result = 'pending' THEN 1 END) as pending_count
FROM sms_trigger_logs;

-- Summary report
SELECT 
    'SMS Database Relations Check Complete' as status,
    NOW() as checked_at;
