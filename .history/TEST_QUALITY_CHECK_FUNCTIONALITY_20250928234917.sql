-- =====================================================
-- TEST QUALITY CHECK FUNCTIONALITY
-- =====================================================
-- This script tests the quality check functionality
-- Run this in your Supabase SQL Editor

-- Test 1: Check if the table structure is correct
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_order_quality_checks'
ORDER BY ordinal_position;

-- Test 2: Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'move_po_to_quality_check',
    'complete_quality_check', 
    'add_item_quality_check',
    'get_quality_check_summary'
);

-- Test 3: Check if view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'purchase_order_quality_details';

-- Test 4: Test the add_item_quality_check function with a sample
-- (This will only work if you have a valid purchase order and item)
/*
-- Uncomment and modify these lines to test with real data:
SELECT add_item_quality_check(
    'your-purchase-order-id'::UUID,
    'your-item-id'::UUID,
    true,
    'Test quality check',
    'test-user'
);
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Quality Check Functionality Test Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What to check:';
    RAISE NOTICE '   1. Table has correct columns (id, purchase_order_id, item_id, passed, notes, checked_by, timestamp, created_at)';
    RAISE NOTICE '   2. Functions exist (move_po_to_quality_check, complete_quality_check, add_item_quality_check, get_quality_check_summary)';
    RAISE NOTICE '   3. View exists (purchase_order_quality_details)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 If all checks pass, the quality check system is ready to use!';
END $$;
