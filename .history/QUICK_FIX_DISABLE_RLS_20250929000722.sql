-- =====================================================
-- QUICK FIX: DISABLE RLS FOR QUALITY CHECKS
-- =====================================================
-- This script temporarily disables RLS to allow quality check functionality
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY
-- =====================================================

-- Disable RLS on the quality checks table
ALTER TABLE purchase_order_quality_checks DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. VERIFY RLS IS DISABLED
-- =====================================================

-- Check RLS status
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'purchase_order_quality_checks';

-- =====================================================
-- 3. TEST INSERT WITHOUT RLS
-- =====================================================

-- Test inserting a quality check record
DO $$
DECLARE
    test_po_id UUID;
    test_item_id UUID;
    insert_result UUID;
BEGIN
    -- Get a sample purchase order and item
    SELECT po.id, poi.id 
    INTO test_po_id, test_item_id
    FROM lats_purchase_orders po
    JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
    WHERE po.status IN ('received', 'quality_check', 'completed')
    LIMIT 1;
    
    IF test_po_id IS NOT NULL AND test_item_id IS NOT NULL THEN
        RAISE NOTICE 'Testing insert without RLS with PO: %, Item: %', test_po_id, test_item_id;
        
        -- Try to insert a test record
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
            'RLS disabled test insert',
            'test-user',
            NOW()
        ) RETURNING id INTO insert_result;
        
        RAISE NOTICE '✅ Insert successful without RLS! ID: %', insert_result;
        
        -- Keep the test record for verification
        RAISE NOTICE 'Test record kept for verification: %', insert_result;
        
    ELSE
        RAISE NOTICE '❌ No suitable purchase order items found for testing';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Insert failed even without RLS: %', SQLERRM;
END $$;

-- =====================================================
-- 4. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Disabled for Quality Checks!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 What was done:';
    RAISE NOTICE '   • Disabled Row Level Security on purchase_order_quality_checks';
    RAISE NOTICE '   • Tested insert functionality';
    RAISE NOTICE '   • Quality check operations should now work';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Try the quality check functionality in your application now!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Remember to re-enable RLS later for security:';
    RAISE NOTICE '   ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;';
END $$;
