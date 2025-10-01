-- Fix status data inconsistency issue
-- The error shows status "receiveds" but should be "received"

-- =====================================================
-- STEP 1: CHECK CURRENT STATUS VALUES
-- =====================================================

SELECT 
    'Current Status Values' as section,
    status,
    COUNT(*) as count
FROM lats_purchase_orders 
GROUP BY status
ORDER BY status;

-- =====================================================
-- STEP 2: FIND ORDERS WITH INCORRECT STATUS
-- =====================================================

SELECT 
    'Orders with Incorrect Status' as section,
    id,
    order_number,
    status,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE status LIKE '%received%'
ORDER BY updated_at DESC;

-- =====================================================
-- STEP 3: FIX THE STATUS DATA
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
-- STEP 4: VERIFY THE FIX
-- =====================================================

SELECT 
    'After Fix - Status Check' as section,
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = 'e5fe9845-0c0f-4b44-b29a-98c54559a5ca';

-- =====================================================
-- STEP 5: UPDATE THE RECEIVE FUNCTION TO HANDLE BOTH CASES
-- =====================================================

-- Drop and recreate the function to handle both "received" and "receiveds"
DROP FUNCTION IF EXISTS complete_purchase_order_receive(UUID, UUID, TEXT);

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
    
    -- Check if PO is already received (handle both "received" and "receiveds")
    IF current_po_status IN ('received', 'receiveds') THEN
        RAISE NOTICE 'Purchase order % (PO#: %s) is already received (status: %)', 
            purchase_order_id_param, current_po_number, current_po_status;
        RETURN TRUE; -- Return success since it's already received
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
        
        -- Create inventory adjustment for received items (if table exists)
        BEGIN
            INSERT INTO lats_inventory_adjustments (
                purchase_order_id,
                product_id,
                variant_id,
                adjustment_type,
                quantity,
                cost_price,
                reason,
                reference_id,
                processed_by
            ) VALUES (
                purchase_order_id_param,
                order_item.product_id,
                order_item.variant_id,
                'receive',
                order_item.quantity,
                order_item.cost_price,
                COALESCE(receive_notes, 'Full receive of purchase order'),
                order_item.id,
                user_id_param
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- Table doesn't exist, continue without inventory adjustment
                RAISE NOTICE 'Inventory adjustments table not found, skipping inventory update';
        END;
        
        received_items := received_items + 1;
    END LOOP;
    
    -- Update purchase order status to "received" (correct spelling)
    UPDATE lats_purchase_orders 
    SET 
        status = 'received',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry (if table exists)
    BEGIN
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
    EXCEPTION
        WHEN undefined_table THEN
            -- Table doesn't exist, continue without audit entry
            RAISE NOTICE 'Audit table not found, skipping audit entry';
        WHEN OTHERS THEN
            -- Other errors, log but continue
            RAISE NOTICE 'Failed to add audit entry: %', SQLERRM;
    END;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- STEP 6: TEST THE FIX
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Status data inconsistency fix applied';
    RAISE NOTICE '📋 Fixed:';
    RAISE NOTICE '   - Corrected "receiveds" to "received"';
    RAISE NOTICE '   - Updated function to handle both cases';
    RAISE NOTICE '   - Function now returns TRUE for already received orders';
    RAISE NOTICE '🎯 Ready for testing';
END $$;
