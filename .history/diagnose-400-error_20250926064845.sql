-- DIAGNOSTIC SCRIPT: Find the exact cause of the 400 Bad Request error
-- Run this first to understand what's wrong with your lats_sales table

-- 1. Check if the table exists at all
SELECT 
    'Table existence check:' as info,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'lats_sales';

-- 2. Check current table structure in detail
SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 3. Check constraints that might be causing issues
SELECT 
    'Table constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'lats_sales'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. Check RLS policies
SELECT 
    'RLS Policies:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'lats_sales';

-- 5. Check if RLS is enabled
SELECT 
    'RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'lats_sales';

-- 6. Try to insert a test record to see the exact error
DO $$
DECLARE
    test_sale_id UUID;
    error_message TEXT;
BEGIN
    -- Try the exact minimal data from your error
    BEGIN
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            status,
            created_by
        ) VALUES (
            'TEST-DIAGNOSTIC-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'bdbd7a39-7536-40c8-a3e3-fdd3f49b1ff1'::UUID,
            550000,
            'completed',
            'System'
        ) RETURNING id INTO test_sale_id;
        
        RAISE NOTICE '✅ Test insert successful with ID: %', test_sale_id;
        
        -- Clean up
        DELETE FROM lats_sales WHERE id = test_sale_id;
        RAISE NOTICE '✅ Test record cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        RAISE NOTICE '❌ Test insert failed: %', error_message;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;

-- 7. Check if there are any triggers that might be interfering
SELECT 
    'Triggers:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'lats_sales';

-- 8. Check table permissions
SELECT 
    'Table permissions:' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'lats_sales';

-- 9. Show any existing data (to understand current state)
SELECT 
    'Existing data count:' as info,
    COUNT(*) as record_count
FROM lats_sales;

-- 10. Check for any foreign key constraints
SELECT 
    'Foreign keys:' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'lats_sales';

-- Final diagnostic summary
SELECT '🔍 Diagnostic complete - check the results above to identify the issue' as status;
