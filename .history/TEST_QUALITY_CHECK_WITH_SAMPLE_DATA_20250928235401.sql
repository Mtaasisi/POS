-- =====================================================
-- TEST QUALITY CHECK WITH SAMPLE DATA
-- =====================================================
-- This script tests the quality check functionality with real data
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CHECK SAMPLE PURCHASE ORDER ITEMS
-- =====================================================

-- Get items from the first sample purchase order
SELECT 
    'Sample purchase order items' as info,
    poi.id as item_id,
    poi.purchase_order_id,
    poi.product_id,
    poi.variant_id,
    poi.quantity,
    poi.received_quantity,
    p.name as product_name,
    p.sku as product_sku
FROM lats_purchase_order_items poi
LEFT JOIN lats_products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038'
LIMIT 3;

-- =====================================================
-- 2. TEST ADDING QUALITY CHECK (using function)
-- =====================================================

-- Test the add_item_quality_check function with sample data
-- First, get a sample item ID
DO $$
DECLARE
    sample_item_id UUID;
    sample_po_id UUID := 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
    result BOOLEAN;
BEGIN
    -- Get the first item from the sample PO
    SELECT poi.id INTO sample_item_id
    FROM lats_purchase_order_items poi
    WHERE poi.purchase_order_id = sample_po_id
    LIMIT 1;
    
    IF sample_item_id IS NOT NULL THEN
        RAISE NOTICE 'Testing quality check for item: %', sample_item_id;
        
        -- Test adding a quality check
        SELECT add_item_quality_check(
            sample_po_id,
            sample_item_id,
            true,  -- passed
            'Test quality check - item passed inspection',
            'test-user'
        ) INTO result;
        
        IF result THEN
            RAISE NOTICE '✅ Quality check added successfully!';
        ELSE
            RAISE NOTICE '❌ Failed to add quality check';
        END IF;
    ELSE
        RAISE NOTICE '❌ No items found for the sample purchase order';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFY QUALITY CHECK WAS CREATED
-- =====================================================

-- Check if the quality check was created
SELECT 
    'Quality checks created' as info,
    qc.id,
    qc.purchase_order_id,
    qc.item_id,
    qc.passed,
    qc.notes,
    qc.checked_by,
    qc.timestamp,
    p.name as product_name
FROM purchase_order_quality_checks qc
LEFT JOIN lats_purchase_order_items poi ON qc.item_id = poi.id
LEFT JOIN lats_products p ON poi.product_id = p.id
WHERE qc.purchase_order_id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038'
ORDER BY qc.timestamp DESC;

-- =====================================================
-- 4. TEST QUALITY CHECK SUMMARY
-- =====================================================

-- Test the quality check summary function
SELECT 
    'Quality check summary' as info,
    total_items,
    checked_items,
    passed_items,
    failed_items,
    pending_items,
    overall_status
FROM get_quality_check_summary('c6292820-c3aa-4a33-bbfb-5abcc5b0b038');

-- =====================================================
-- 5. TEST QUALITY CHECK VIEW
-- =====================================================

-- Test the quality check details view
SELECT 
    'Quality check details view' as info,
    purchase_order_id,
    order_number,
    po_status,
    item_id,
    product_name,
    quantity,
    received_quantity,
    quality_check_id,
    passed,
    quality_notes,
    checked_by,
    checked_at,
    quality_status
FROM purchase_order_quality_details
WHERE purchase_order_id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038'
ORDER BY checked_at DESC;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Quality Check System Test Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was tested:';
    RAISE NOTICE '   • Sample purchase order items retrieved';
    RAISE NOTICE '   • Quality check added using function';
    RAISE NOTICE '   • Quality check verified in database';
    RAISE NOTICE '   • Quality check summary generated';
    RAISE NOTICE '   • Quality check view accessed';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 If all tests passed, the quality check system is working correctly!';
    RAISE NOTICE '🔧 The 401 Unauthorized error should now be resolved in your application.';
END $$;
