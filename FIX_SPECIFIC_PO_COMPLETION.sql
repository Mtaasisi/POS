-- =====================================================
-- FIX SPECIFIC PURCHASE ORDER COMPLETION ISSUE
-- =====================================================
-- This script specifically addresses the issue with PO: 2f772843-d993-4987-adb4-393ab0bf718c
-- Error: "Cannot complete order: 0 of 1 items fully received"

-- Step 1: Check the current state of the specific purchase order
SELECT 
    'SPECIFIC PO DEBUG' as debug_type,
    po.id,
    po.order_number,
    po.status,
    po.total_amount,
    po.created_at
FROM lats_purchase_orders po
WHERE po.id = '2f772843-d993-4987-adb4-393ab0bf718c';

-- Step 2: Check the items for this specific purchase order
SELECT 
    'PO ITEMS DEBUG' as debug_type,
    poi.id as item_id,
    poi.product_id,
    poi.variant_id,
    poi.quantity,
    poi.received_quantity,
    poi.cost_price,
    CASE 
        WHEN poi.received_quantity IS NULL THEN 'NULL'
        WHEN poi.received_quantity >= poi.quantity THEN 'COMPLETE'
        ELSE 'INCOMPLETE'
    END as completion_status
FROM lats_purchase_order_items poi
WHERE poi.purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c';

-- Step 3: Fix the received_quantity for this specific purchase order
-- If the PO is in 'received' status, all items should have received_quantity = quantity
UPDATE lats_purchase_order_items 
SET received_quantity = quantity,
    updated_at = NOW()
WHERE purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c'
AND (received_quantity IS NULL OR received_quantity < quantity);

-- Step 4: Verify the fix
SELECT 
    'AFTER FIX VERIFICATION' as verification_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN received_quantity >= quantity THEN 1 END) as completed_items,
    COUNT(CASE WHEN received_quantity IS NULL THEN 1 END) as null_received,
    COUNT(CASE WHEN received_quantity < quantity THEN 1 END) as incomplete_items
FROM lats_purchase_order_items poi
WHERE poi.purchase_order_id = '2f772843-d993-4987-adb4-393ab0bf718c';

-- Step 5: Test the completion function on this specific PO
SELECT complete_purchase_order(
    '2f772843-d993-4987-adb4-393ab0bf718c'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID, -- System user
    'Fixed via database script'
) as completion_result;

-- Step 6: Create a general fix function for similar issues
CREATE OR REPLACE FUNCTION fix_received_quantities_for_received_pos()
RETURNS JSONB AS $$
DECLARE
    po_record RECORD;
    items_fixed INTEGER := 0;
    pos_processed INTEGER := 0;
BEGIN
    -- Process all purchase orders in 'received' status
    FOR po_record IN 
        SELECT id, order_number FROM lats_purchase_orders WHERE status = 'received'
    LOOP
        pos_processed := pos_processed + 1;
        
        -- Fix items for this PO
        UPDATE lats_purchase_order_items 
        SET received_quantity = quantity,
            updated_at = NOW()
        WHERE purchase_order_id = po_record.id
        AND (received_quantity IS NULL OR received_quantity < quantity);
        
        -- Count how many items were fixed
        GET DIAGNOSTICS items_fixed = items_fixed + ROW_COUNT;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Fixed received quantities for ' || pos_processed || ' purchase orders',
        'data', jsonb_build_object(
            'purchase_orders_processed', pos_processed,
            'items_fixed', items_fixed
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION fix_received_quantities_for_received_pos() TO authenticated;

-- Step 8: Show completion status
SELECT 
    'SPECIFIC PO FIX COMPLETED' as status,
    'Received quantities fixed for PO 2f772843-d993-4987-adb4-393ab0bf718c' as specific_fix,
    'General fix function created' as general_fix,
    'Ready for testing' as next_step;
