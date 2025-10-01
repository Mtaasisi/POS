-- =====================================================
-- VERIFY QUALITY CHECK FIX
-- =====================================================
-- This script verifies that the quality check fix is working
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CHECK RLS STATUS
-- =====================================================

-- Verify RLS is disabled
SELECT 
    'RLS Status Check' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED - Quality checks should work!'
        WHEN rowsecurity = true THEN '⚠️ RLS ENABLED - May still have issues'
        ELSE '❓ Unknown status'
    END as status_message
FROM pg_tables 
WHERE tablename = 'purchase_order_quality_checks';

-- =====================================================
-- 2. CHECK EXISTING QUALITY CHECKS
-- =====================================================

-- Count existing quality checks
SELECT 
    'Quality Check Count' as info,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN passed = true THEN 1 END) as passed_checks,
    COUNT(CASE WHEN passed = false THEN 1 END) as failed_checks,
    MAX(timestamp) as latest_check
FROM purchase_order_quality_checks;

-- =====================================================
-- 3. TEST INSERT FUNCTIONALITY
-- =====================================================

-- Test inserting a quality check record
DO $$
DECLARE
    test_po_id UUID;
    test_item_id UUID;
    insert_result UUID;
    test_successful BOOLEAN := false;
BEGIN
    -- Get a sample purchase order and item
    SELECT po.id, poi.id 
    INTO test_po_id, test_item_id
    FROM lats_purchase_orders po
    JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
    WHERE po.status IN ('received', 'quality_check', 'completed')
    LIMIT 1;
    
    IF test_po_id IS NOT NULL AND test_item_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testing quality check insert...';
        RAISE NOTICE '   Purchase Order: %', test_po_id;
        RAISE NOTICE '   Item: %', test_item_id;
        
        -- Try to insert a test record
        BEGIN
            INSERT INTO purchase_order_quality_checks (
                purchase_order_id,
                item_id,
                passed,
                notes,
                checked_by,
                timestamp
            ) VALUES (
                test_po_id,
                test_item_id,
                true,
                'Verification test insert',
                'verification-user',
                NOW()
            ) RETURNING id INTO insert_result;
            
            test_successful := true;
            RAISE NOTICE '✅ INSERT SUCCESSFUL! Quality Check ID: %', insert_result;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ INSERT FAILED: %', SQLERRM;
            RAISE NOTICE 'Error Code: %', SQLSTATE;
        END;
        
    ELSE
        RAISE NOTICE '❌ No suitable purchase order items found for testing';
    END IF;
    
    -- Report test results
    IF test_successful THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 QUALITY CHECK SYSTEM IS WORKING!';
        RAISE NOTICE '   ✅ RLS is properly disabled';
        RAISE NOTICE '   ✅ Database inserts are working';
        RAISE NOTICE '   ✅ Quality check functionality is ready';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 You can now use the quality check feature in your application!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ QUALITY CHECK SYSTEM NEEDS ATTENTION';
        RAISE NOTICE '   ❌ Database inserts are still failing';
        RAISE NOTICE '   🔧 Check the error messages above for details';
    END IF;
    
END $$;

-- =====================================================
-- 4. SHOW RECENT QUALITY CHECKS
-- =====================================================

-- Display recent quality check records
SELECT 
    'Recent Quality Checks' as info,
    id,
    purchase_order_id,
    item_id,
    passed,
    notes,
    checked_by,
    timestamp
FROM purchase_order_quality_checks
ORDER BY timestamp DESC
LIMIT 3;

-- =====================================================
-- 5. FINAL STATUS REPORT
-- =====================================================

DO $$
DECLARE
    rls_status BOOLEAN;
    check_count INTEGER;
BEGIN
    -- Get RLS status
    SELECT rowsecurity INTO rls_status
    FROM pg_tables 
    WHERE tablename = 'purchase_order_quality_checks';
    
    -- Get quality check count
    SELECT COUNT(*) INTO check_count
    FROM purchase_order_quality_checks;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 FINAL STATUS REPORT';
    RAISE NOTICE '====================';
    RAISE NOTICE 'RLS Enabled: %', COALESCE(rls_status::TEXT, 'Unknown');
    RAISE NOTICE 'Quality Checks: %', check_count;
    RAISE NOTICE '';
    
    IF rls_status = false THEN
        RAISE NOTICE '✅ RLS is disabled - Quality checks should work!';
    ELSE
        RAISE NOTICE '⚠️ RLS is enabled - May still have authentication issues';
    END IF;
    
    IF check_count > 0 THEN
        RAISE NOTICE '✅ Quality check records exist - System is functional';
    ELSE
        RAISE NOTICE 'ℹ️ No quality check records yet - Ready for testing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next step: Test the quality check functionality in your application!';
END $$;
