-- =====================================================
-- FIX RECEIVED QUANTITY DATA INCONSISTENCIES
-- =====================================================
-- This script fixes data inconsistencies where received_quantity might be NULL
-- or not properly set when items are received

-- Step 1: Check current data inconsistencies
SELECT 
    'DATA INCONSISTENCY CHECK' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN received_quantity IS NULL THEN 1 END) as null_received_quantity,
    COUNT(CASE WHEN received_quantity = 0 THEN 1 END) as zero_received_quantity,
    COUNT(CASE WHEN received_quantity > quantity THEN 1 END) as over_received_quantity
FROM lats_purchase_order_items poi
JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.status = 'received';

-- Step 2: Fix NULL received_quantity for items in 'received' purchase orders
-- If a purchase order is marked as 'received', all its items should have received_quantity = quantity
UPDATE lats_purchase_order_items 
SET received_quantity = quantity,
    updated_at = NOW()
WHERE received_quantity IS NULL 
AND purchase_order_id IN (
    SELECT id FROM lats_purchase_orders WHERE status = 'received'
);

-- Step 3: Fix zero received_quantity for items in 'received' purchase orders
UPDATE lats_purchase_order_items 
SET received_quantity = quantity,
    updated_at = NOW()
WHERE received_quantity = 0 
AND purchase_order_id IN (
    SELECT id FROM lats_purchase_orders WHERE status = 'received'
);

-- Step 4: Create a function to safely update received quantities
CREATE OR REPLACE FUNCTION update_received_quantity(
    item_id_param UUID,
    new_received_quantity INTEGER,
    user_id_param UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    item_record RECORD;
    po_record RECORD;
BEGIN
    -- Get item details
    SELECT poi.*, po.status as po_status, po.order_number
    INTO item_record
    FROM lats_purchase_order_items poi
    JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.id = item_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Item not found'
        );
    END IF;
    
    -- Validate received quantity
    IF new_received_quantity < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Received quantity cannot be negative'
        );
    END IF;
    
    IF new_received_quantity > item_record.quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Received quantity cannot exceed ordered quantity'
        );
    END IF;
    
    -- Update the received quantity
    UPDATE lats_purchase_order_items 
    SET 
        received_quantity = new_received_quantity,
        updated_at = NOW()
    WHERE id = item_id_param;
    
    -- Check if all items in this PO are now fully received
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN received_quantity >= quantity THEN 1 END) as completed
    INTO po_record
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = item_record.purchase_order_id;
    
    -- If all items are fully received, update PO status to 'received'
    IF po_record.completed = po_record.total AND po_record.total > 0 THEN
        UPDATE lats_purchase_orders 
        SET status = 'received', updated_at = NOW()
        WHERE id = item_record.purchase_order_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Received quantity updated successfully',
        'data', jsonb_build_object(
            'item_id', item_id_param,
            'old_received_quantity', item_record.received_quantity,
            'new_received_quantity', new_received_quantity,
            'order_quantity', item_record.quantity,
            'po_status', item_record.po_status,
            'po_number', item_record.order_number
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error updating received quantity: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a function to fix all received quantities for a purchase order
CREATE OR REPLACE FUNCTION fix_purchase_order_received_quantities(
    purchase_order_id_param UUID,
    user_id_param UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    item_record RECORD;
    total_fixed INTEGER := 0;
    po_record RECORD;
BEGIN
    -- Get PO details
    SELECT * INTO po_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Purchase order not found'
        );
    END IF;
    
    -- Fix all items in this PO
    FOR item_record IN 
        SELECT * FROM lats_purchase_order_items 
        WHERE purchase_order_id = purchase_order_id_param
    LOOP
        -- If PO is received, set received_quantity = quantity
        IF po_record.status = 'received' THEN
            UPDATE lats_purchase_order_items 
            SET received_quantity = item_record.quantity,
                updated_at = NOW()
            WHERE id = item_record.id;
            total_fixed := total_fixed + 1;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fixed ' || total_fixed || ' items in purchase order ' || po_record.order_number,
        'data', jsonb_build_object(
            'purchase_order_id', purchase_order_id_param,
            'order_number', po_record.order_number,
            'status', po_record.status,
            'items_fixed', total_fixed
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error fixing received quantities: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION update_received_quantity(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_purchase_order_received_quantities(UUID, UUID) TO authenticated;

-- Step 7: Show results
SELECT 
    'DATA FIXES APPLIED' as status,
    'NULL received_quantity fixed for received POs' as fix_1,
    'Zero received_quantity fixed for received POs' as fix_2,
    'Helper functions created' as helper_functions;
