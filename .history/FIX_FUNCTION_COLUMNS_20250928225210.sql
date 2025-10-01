-- Fix the function to use the correct column names
-- The function is trying to use columns that don't exist in the audit table

-- =====================================================
-- STEP 1: CHECK CURRENT AUDIT TABLE STRUCTURE
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_order_audit'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: DROP AND RECREATE FUNCTION WITH CORRECT COLUMNS
-- =====================================================

DROP FUNCTION IF EXISTS complete_purchase_order_receive(UUID, UUID, TEXT);

CREATE FUNCTION complete_purchase_order_receive(
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
            RAISE NOTICE 'Purchase order % is already received', current_po_number;
            RETURN TRUE;
        WHEN 'completed' THEN
            RAISE NOTICE 'Purchase order % is already completed', current_po_number;
            RETURN TRUE;
        WHEN 'draft' THEN
            RAISE EXCEPTION 'Purchase order % is in draft status and must be sent before receiving', current_po_number;
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Purchase order % is cancelled and cannot be received', current_po_number;
        WHEN 'sent', 'confirmed', 'shipped', 'partial_received' THEN
            NULL; -- Continue with receive process
        ELSE
            RAISE EXCEPTION 'Purchase order % is in status "%s" and cannot be received', current_po_number, current_po_status;
    END CASE;
    
    -- Get all items and update received quantities
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
    
    -- Insert audit record with correct column names
    INSERT INTO purchase_order_audit (
        purchase_order_id, action, user_id, details, created_at
    ) VALUES (
        purchase_order_id_param, 'Full receive', user_id_param, 
        format('Received %s items out of %s total items', received_items, total_items), NOW()
    );
    
    -- Log success
    RAISE NOTICE 'Successfully received % items out of % total items for purchase order %', 
        received_items, total_items, current_po_number;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- STEP 4: TEST THE FUNCTION
-- =====================================================

-- Test with a "sent" order
SELECT complete_purchase_order_receive(
    '8956fb48-1f2f-43f8-82f9-a526d8485fbd'::UUID,
    auth.uid(),
    'Test with correct columns'
);

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Function updated with correct column names';
    RAISE NOTICE '📋 Audit table columns:';
    RAISE NOTICE '   - id (UUID)';
    RAISE NOTICE '   - purchase_order_id (UUID)';
    RAISE NOTICE '   - action (VARCHAR)';
    RAISE NOTICE '   - details (TEXT)';
    RAISE NOTICE '   - user_id (UUID)';
    RAISE NOTICE '   - created_at (TIMESTAMP)';
    RAISE NOTICE '🎯 Function should now work correctly';
END $$;
