-- =====================================================
-- DEBUG QUALITY CHECK ERRORS
-- =====================================================
-- This script helps debug persistent quality check errors
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =====================================================

-- Verify the table structure is correct
SELECT 
    'Table structure check' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_order_quality_checks'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK RLS POLICIES STATUS
-- =====================================================

-- Verify RLS is enabled and policies exist
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'purchase_order_quality_checks';

-- Check all policies
SELECT 
    'RLS Policies' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchase_order_quality_checks'
ORDER BY policyname;

-- =====================================================
-- 3. CHECK RECENT QUALITY CHECKS
-- =====================================================

-- Check if any quality checks exist
SELECT 
    'Recent quality checks' as info,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN passed = true THEN 1 END) as passed_checks,
    COUNT(CASE WHEN passed = false THEN 1 END) as failed_checks,
    MAX(timestamp) as latest_check
FROM purchase_order_quality_checks;

-- Show recent quality check records
SELECT 
    'Quality check records' as info,
    id,
    purchase_order_id,
    item_id,
    passed,
    notes,
    checked_by,
    timestamp,
    created_at
FROM purchase_order_quality_checks
ORDER BY timestamp DESC
LIMIT 5;

-- =====================================================
-- 4. CHECK PURCHASE ORDER ITEMS
-- =====================================================

-- Check if there are items to quality check
SELECT 
    'Purchase order items' as info,
    poi.id as item_id,
    poi.purchase_order_id,
    poi.product_id,
    poi.quantity,
    poi.received_quantity,
    p.name as product_name,
    po.status as po_status
FROM lats_purchase_order_items poi
LEFT JOIN lats_products p ON poi.product_id = p.id
LEFT JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.status IN ('received', 'quality_check', 'completed')
ORDER BY po.updated_at DESC
LIMIT 5;

-- =====================================================
-- 5. TEST INSERT MANUALLY
-- =====================================================

-- Test inserting a quality check record manually
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
        RAISE NOTICE 'Testing manual insert with PO: %, Item: %', test_po_id, test_item_id;
        
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
            'Manual test insert',
            'debug-user',
            NOW()
        ) RETURNING id INTO insert_result;
        
        RAISE NOTICE '✅ Manual insert successful! ID: %', insert_result;
        
        -- Clean up the test record
        DELETE FROM purchase_order_quality_checks WHERE id = insert_result;
        RAISE NOTICE 'Test record cleaned up';
        
    ELSE
        RAISE NOTICE '❌ No suitable purchase order items found for testing';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Manual insert failed: %', SQLERRM;
END $$;

-- =====================================================
-- 6. CHECK AUTHENTICATION CONTEXT
-- =====================================================

-- Check current user context (this might be null in SQL editor)
SELECT 
    'Auth context' as info,
    current_user as current_user,
    session_user as session_user,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Quality Check Debug Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What to check:';
    RAISE NOTICE '   1. Table structure has correct columns';
    RAISE NOTICE '   2. RLS is enabled with proper policies';
    RAISE NOTICE '   3. Recent quality checks exist (if any)';
    RAISE NOTICE '   4. Purchase order items are available';
    RAISE NOTICE '   5. Manual insert test passed/failed';
    RAISE NOTICE '   6. Authentication context is available';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 If manual insert fails, the issue is with RLS policies or table structure';
    RAISE NOTICE '🎯 If manual insert works, the issue is with the frontend service calls';
END $$;
