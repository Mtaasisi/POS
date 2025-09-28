-- Verification script for diagnostic system
-- Run this to check if everything is working correctly

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses')
AND policyname = 'Enable all access for authenticated users'
ORDER BY tablename;

-- Check triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('diagnostic_checklist_results', 'device_diagnoses')
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Check tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('diagnostic_checklist_results', 'device_diagnoses', 'diagnostic_problem_templates')
ORDER BY table_name;

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses')
ORDER BY tablename, indexname;

-- Check if the update function exists
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Summary
SELECT 
    'Policies' as component,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses')
AND policyname = 'Enable all access for authenticated users'

UNION ALL

SELECT 
    'Triggers' as component,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table IN ('diagnostic_checklist_results', 'device_diagnoses')
AND trigger_name LIKE '%updated_at%'

UNION ALL

SELECT 
    'Tables' as component,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('diagnostic_checklist_results', 'device_diagnoses', 'diagnostic_problem_templates')

UNION ALL

SELECT 
    'Indexes' as component,
    COUNT(*) as count
FROM pg_indexes 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses');
