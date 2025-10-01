-- Comprehensive fix for all receive functionality issues
-- This handles all status cases and prevents 400 errors

-- =====================================================
-- STEP 1: CHECK ALL STATUS VALUES
-- =====================================================

SELECT 
    'Current Status Summary' as section,
    status,
    COUNT(*) as count
FROM lats_purchase_orders 
GROUP BY status
ORDER BY status;

-- =====================================================
-- STEP 2: FIX ANY STATUS DATA INCONSISTENCIES
-- =====================================================

-- Fix any "receiveds" to "received"
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE status = 'receiveds';

-- =====================================================
-- STEP 3: CREATE ROBUST RECEIVE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    current_po_status TEXT;
    current_po_number TEXT;
BEGIN
    -- Get current PO status and number
    SELECT status, order_number INTO current_po_status, current_po_number
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_po_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order not found';
    END IF;
    
    -- Handle different status cases
    CASE current_po_status
        WHEN 'received' THEN
            RAISE NOTICE 'Purchase order % (PO#: %s) is already received', 
                purchase_order_id_param, current_po_number;
            RETURN TRUE; -- Success - already received
            
        WHEN 'completed' THEN
            RAISE NOTICE 'Purchase order % (PO#: %s) is already completed', 
                purchase_order_id_param, current_po_number;
            RETURN TRUE; -- Success - already completed
            
        WHEN 'draft' THEN
            RAISE EXCEPTION 'Purchase order % (PO#: %s) is in draft status and must be sent before receiving', 
                purchase_order_id_param, current_po_number;
                
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Purchase order % (PO#: %s) is cancelled and cannot be received', 
                purchase_order_id_param, current_po_number;
                
        WHEN 'sent', 'confirmed', 'shipped', 'partial_received' THEN
            -- These are receivable statuses - continue with receive process
            NULL;
            
        ELSE
            RAISE EXCEPTION 'Purchase order % (PO#: %s) is in status "%s" and cannot be received. Allowed statuses: sent, confirmed, shipped, partial_received', 
                purchase_order_id_param, current_po_number, current_po_status;
    END CASE;
    
    -- Get all items and their current received quantities
    FOR order_item IN 
        SELECT 
            poi.id,
            poi.product_id,
            poi.variant_id,
            poi.quantity,
            poi.received_quantity,
            poi.cost_price
        FROM lats_purchase_order_items poi
        WHERE poi.purchase_order_id = purchase_order_id_param
    LOOP
        total_items := total_items + 1;
        
        -- Update received quantity to match ordered quantity
        UPDATE lats_purchase_order_items 
        SET 
            received_quantity = order_item.quantity,
            updated_at = NOW()
        WHERE id = order_item.id;
        
        received_items := received_items + 1;
    END LOOP;
    
    -- Update purchase order status
    UPDATE lats_purchase_orders 
    SET 
        status = 'received',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        details,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'Full receive',
        user_id_param,
        format('Received %s items out of %s total items', received_items, total_items),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- STEP 4: TEST WITH DIFFERENT STATUS ORDERS
-- =====================================================

-- Test with "sent" status order (should work)
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing with "sent" status order...';
    
    SELECT complete_purchase_order_receive(
        '8956fb48-1f2f-43f8-82f9-a526d8485fbd'::UUID,  -- sent status
        auth.uid(),
        'Test receive sent order'
    ) INTO test_result;
    
    IF test_result THEN
        RAISE NOTICE '✅ "sent" order test PASSED';
    ELSE
        RAISE NOTICE '❌ "sent" order test FAILED';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ "sent" order test FAILED: %', SQLERRM;
END $$;

-- Test with "completed" status order (should return TRUE)
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing with "completed" status order...';
    
    SELECT complete_purchase_order_receive(
        '30053b25-0819-4e1b-a360-c151c00f5ed4'::UUID,  -- completed status
        auth.uid(),
        'Test receive completed order'
    ) INTO test_result;
    
    IF test_result THEN
        RAISE NOTICE '✅ "completed" order test PASSED (returned TRUE)';
    ELSE
        RAISE NOTICE '❌ "completed" order test FAILED';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ "completed" order test FAILED: %', SQLERRM;
END $$;

-- Test with "draft" status order (should fail with clear error)
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing with "draft" status order...';
    
    SELECT complete_purchase_order_receive(
        '2f772843-d993-4987-adb4-393ab0bf718c'::UUID,  -- draft status
        auth.uid(),
        'Test receive draft order'
    ) INTO test_result;
    
    RAISE NOTICE '❌ "draft" order test should have failed but returned: %', test_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '✅ "draft" order test PASSED (correctly failed): %', SQLERRM;
END $$;

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Comprehensive receive function fix applied';
    RAISE NOTICE '📋 Function now handles:';
    RAISE NOTICE '   - "sent", "confirmed", "shipped", "partial_received" → Can be received';
    RAISE NOTICE '   - "received" → Returns TRUE (already received)';
    RAISE NOTICE '   - "completed" → Returns TRUE (already completed)';
    RAISE NOTICE '   - "draft" → Clear error message (must be sent first)';
    RAISE NOTICE '   - "cancelled" → Clear error message (cannot receive)';
    RAISE NOTICE '🎯 All 400 errors should now be resolved';
END $$;
