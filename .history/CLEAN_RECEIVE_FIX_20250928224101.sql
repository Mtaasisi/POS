-- Clean fix for receive functionality
-- Run this step by step to avoid syntax errors

-- Step 1: Check current statuses
SELECT status, COUNT(*) as count
FROM lats_purchase_orders 
GROUP BY status
ORDER BY status;

-- Step 2: Fix any "receiveds" to "received"
UPDATE lats_purchase_orders 
SET status = 'received', updated_at = NOW()
WHERE status = 'receiveds';

-- Step 3: Create the fixed function
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
    SELECT status, order_number INTO current_po_status, current_po_number
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF current_po_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order not found';
    END IF;
    
    CASE current_po_status
        WHEN 'received' THEN
            RAISE NOTICE 'Purchase order is already received';
            RETURN TRUE;
        WHEN 'completed' THEN
            RAISE NOTICE 'Purchase order is already completed';
            RETURN TRUE;
        WHEN 'draft' THEN
            RAISE EXCEPTION 'Purchase order is in draft status and must be sent before receiving';
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Purchase order is cancelled and cannot be received';
        WHEN 'sent', 'confirmed', 'shipped', 'partial_received' THEN
            NULL;
        ELSE
            RAISE EXCEPTION 'Purchase order is in status "%s" and cannot be received', current_po_status;
    END CASE;
    
    FOR order_item IN 
        SELECT poi.id, poi.product_id, poi.variant_id, poi.quantity, poi.received_quantity, poi.cost_price
        FROM lats_purchase_order_items poi
        WHERE poi.purchase_order_id = purchase_order_id_param
    LOOP
        total_items := total_items + 1;
        UPDATE lats_purchase_order_items 
        SET received_quantity = order_item.quantity, updated_at = NOW()
        WHERE id = order_item.id;
        received_items := received_items + 1;
    END LOOP;
    
    UPDATE lats_purchase_orders 
    SET status = 'received', updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id, action, user_id, details, created_at
    ) VALUES (
        purchase_order_id_param, 'Full receive', user_id_param, 
        format('Received %s items out of %s total items', received_items, total_items), NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;
