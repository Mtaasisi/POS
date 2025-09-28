-- =====================================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- =====================================================
-- Run this script to verify all action tables are properly set up
-- =====================================================

-- Check if all required tables exist
SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All tables exist'
        ELSE '❌ Missing tables: ' || (5 - COUNT(*)) || ' missing'
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'purchase_order_audit',
    'purchase_order_messages', 
    'purchase_order_quality_checks',
    'purchase_order_return_items',
    'purchase_order_returns'
);

-- List all action-related tables
SELECT 
    'Table Details' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'purchase_order_audit' THEN '✅ Audit trail'
        WHEN table_name = 'purchase_order_messages' THEN '✅ Notes & Messages'
        WHEN table_name = 'purchase_order_quality_checks' THEN '✅ Quality checks'
        WHEN table_name = 'purchase_order_return_items' THEN '✅ Return items'
        WHEN table_name = 'purchase_order_returns' THEN '✅ Return orders'
        ELSE '❓ Unknown'
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'purchase_order%'
ORDER BY table_name;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Policy exists'
        ELSE '❌ No policy'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'purchase_order%'
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
    'Indexes' as check_type,
    indexname,
    tablename,
    '✅ Index exists' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'purchase_order%'
ORDER BY tablename, indexname;

-- Check functions
SELECT 
    'Functions' as check_type,
    routine_name,
    routine_type,
    '✅ Function exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%return%'
ORDER BY routine_name;

-- Test basic insert permissions (this will show if RLS is working)
DO $$
DECLARE
    test_order_id UUID;
    test_item_id UUID;
    insert_success BOOLEAN := FALSE;
BEGIN
    -- Try to get a test order ID
    SELECT id INTO test_order_id 
    FROM lats_purchase_orders 
    LIMIT 1;
    
    IF test_order_id IS NOT NULL THEN
        -- Try to insert a test audit record
        BEGIN
            INSERT INTO purchase_order_audit (
                purchase_order_id, 
                action, 
                details, 
                timestamp
            ) VALUES (
                test_order_id,
                'test_action',
                '{"test": true}'::jsonb,
                NOW()
            );
            insert_success := TRUE;
        EXCEPTION WHEN OTHERS THEN
            insert_success := FALSE;
        END;
        
        -- Clean up test record
        IF insert_success THEN
            DELETE FROM purchase_order_audit 
            WHERE action = 'test_action';
        END IF;
        
        RAISE NOTICE 'RLS Test: %', 
            CASE 
                WHEN insert_success THEN '✅ RLS policies allow inserts'
                ELSE '❌ RLS policies blocking inserts'
            END;
    ELSE
        RAISE NOTICE '❌ No purchase orders found for RLS test';
    END IF;
END $$;

-- Final summary
SELECT 
    'SUMMARY' as check_type,
    'Database verification complete. Check results above.' as result;
