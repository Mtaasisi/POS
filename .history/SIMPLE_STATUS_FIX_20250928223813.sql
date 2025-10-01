-- Simple fix for the status data inconsistency
-- This addresses the "receiveds" vs "received" issue

-- =====================================================
-- STEP 1: CHECK CURRENT STATUS VALUES
-- =====================================================

SELECT 
    status,
    COUNT(*) as count
FROM lats_purchase_orders 
GROUP BY status
ORDER BY status;

-- =====================================================
-- STEP 2: FIX THE STATUS DATA
-- =====================================================

-- Fix the specific order mentioned in the error
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE id = 'e5fe9845-0c0f-4b44-b29a-98c54559a5ca'
AND status = 'receiveds';

-- Fix any other orders with similar issues
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE status = 'receiveds';

-- =====================================================
-- STEP 3: VERIFY THE FIX
-- =====================================================

SELECT 
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = 'e5fe9845-0c0f-4b44-b29a-98c54559a5ca';

-- =====================================================
-- STEP 4: UPDATE THE RECEIVE FUNCTION TO HANDLE ALREADY RECEIVED ORDERS
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
    
    -- Check if PO is already received - return success instead of error
    IF current_po_status = 'received' THEN
        RAISE NOTICE 'Purchase order % (PO#: %s) is already received', 
            purchase_order_id_param, current_po_number;
        RETURN TRUE;
    END IF;
    
    -- Check if PO is in receivable status
    IF current_po_status NOT IN ('sent', 'confirmed', 'shipped', 'partial_received') THEN
        RAISE EXCEPTION 'Purchase order % (PO#: %s) is in status "%s" and cannot be received. Allowed statuses: sent, confirmed, shipped, partial_received', 
            purchase_order_id_param, current_po_number, current_po_status;
    END IF;
    
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
-- STEP 5: TEST THE FIX
-- =====================================================

-- Test with the problematic order
SELECT complete_purchase_order_receive(
    'e5fe9845-0c0f-4b44-b29a-98c54559a5ca'::UUID,
    auth.uid(),
    'Test after status fix'
) as test_result;
