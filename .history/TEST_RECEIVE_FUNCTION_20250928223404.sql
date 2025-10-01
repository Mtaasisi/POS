-- Test script for the receive function
-- Run this after applying the COMPLETE_RECEIVE_FUNCTION_FIX.sql

-- =====================================================
-- STEP 1: CHECK CURRENT PURCHASE ORDER STATUSES
-- =====================================================

-- Find purchase orders that can be received
SELECT 
    id,
    order_number,
    status,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE status IN ('sent', 'confirmed', 'shipped', 'partial_received')
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 2: TEST THE RECEIVE FUNCTION
-- =====================================================

-- Test the function with a specific purchase order
-- Replace 'YOUR_PO_ID' with an actual purchase order ID from step 1
DO $$
DECLARE
    test_po_id UUID;
    test_user_id UUID;
    result BOOLEAN;
BEGIN
    -- Get a test purchase order ID
    SELECT id INTO test_po_id
    FROM lats_purchase_orders 
    WHERE status IN ('sent', 'confirmed', 'shipped', 'partial_received')
    LIMIT 1;
    
    -- Get a test user ID (replace with actual user ID)
    SELECT id INTO test_user_id
    FROM auth.users
    LIMIT 1;
    
    IF test_po_id IS NOT NULL THEN
        RAISE NOTICE 'Testing receive function with PO ID: %', test_po_id;
        RAISE NOTICE 'Using user ID: %', test_user_id;
        
        -- Test the function
        BEGIN
            SELECT complete_purchase_order_receive(
                test_po_id,
                test_user_id,
                'Test receive operation'
            ) INTO result;
            
            IF result THEN
                RAISE NOTICE '✅ Receive function test PASSED';
            ELSE
                RAISE NOTICE '❌ Receive function test FAILED - returned FALSE';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Receive function test FAILED with error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ No purchase orders found in receivable status for testing';
    END IF;
END $$;

-- =====================================================
-- STEP 3: VERIFY RESULTS
-- =====================================================

-- Check if the test purchase order was updated to 'received' status
SELECT 
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE status = 'received'
ORDER BY updated_at DESC
LIMIT 3;

-- Check audit entries
SELECT 
    id,
    purchase_order_id,
    action,
    details,
    user_id,
    created_at
FROM lats_purchase_order_audit
ORDER BY created_at DESC
LIMIT 5;

-- Check if purchase order items were updated
SELECT 
    poi.id,
    poi.purchase_order_id,
    poi.quantity,
    poi.received_quantity,
    poi.updated_at
FROM lats_purchase_order_items poi
JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
ORDER BY poi.updated_at DESC
LIMIT 5;
