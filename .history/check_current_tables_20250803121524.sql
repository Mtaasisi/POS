-- Check Current Database Tables
-- This script shows all existing tables and their structure

-- Show all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show specific tables we're looking for
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('user_daily_goals'),
        ('user_goals'),
        ('staff_points'),
        ('customer_checkins'),
        ('customers'),
        ('devices'),
        ('inventory_products'),
        ('whatsapp_chats'),
        ('whatsapp_messages'),
        ('communication_templates')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public';

-- Show table structure for key tables (if they exist)
-- Check user_daily_goals structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Check user_goals structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_goals'
ORDER BY ordinal_position;

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
    AND tablename IN ('user_daily_goals', 'user_goals', 'staff_points', 'customer_checkins')
ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('user_daily_goals', 'user_goals')
ORDER BY event_object_table, trigger_name; 