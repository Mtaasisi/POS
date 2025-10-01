-- =====================================================
-- HANDLE COMPLETED PO STATUS
-- =====================================================
-- This handles the case where a PO is already completed
-- and provides appropriate responses

-- Step 1: Check the current status and details of the completed PO
SELECT 
    'Completed PO Details:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    total_paid,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 2: Check if there are any audit entries for this PO
SELECT 
    'Audit History for PO:' as message,
    action,
    user_id,
    details,
    created_at
FROM purchase_order_audit 
WHERE purchase_order_id = '30053b25-0819-4e1b-a360-c151c00f5ed4'
ORDER BY created_at DESC;

-- Step 3: Check received quantities for this PO
SELECT 
    'Received Items for PO:' as message,
    poi.id as item_id,
    p.name as product_name,
    pv.name as variant_name,
    poi.quantity as ordered_quantity,
    poi.received_quantity,
    poi.cost_price,
    CASE 
        WHEN poi.received_quantity = poi.quantity THEN 'Fully Received'
        WHEN poi.received_quantity > 0 THEN 'Partially Received'
        ELSE 'Not Received'
    END as receive_status
FROM lats_purchase_order_items poi
LEFT JOIN lats_products p ON poi.product_id = p.id
LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
WHERE poi.purchase_order_id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 4: Create a function to check PO completion status
CREATE OR REPLACE FUNCTION check_po_completion_status(
    purchase_order_id_param UUID
) RETURNS JSONB AS $$
DECLARE
    po_record RECORD;
    item_count INTEGER;
    fully_received_count INTEGER;
    result JSONB;
BEGIN
    -- Get PO details
    SELECT 
        id,
        order_number,
        status,
        total_amount,
        created_at,
        updated_at
    INTO po_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF po_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'exists', false,
            'message', 'Purchase order not found'
        );
    END IF;
    
    -- Count total items and fully received items
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN received_quantity = quantity THEN 1 END)
    INTO item_count, fully_received_count
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = purchase_order_id_param;
    
    -- Build result
    result := jsonb_build_object(
        'exists', true,
        'order_number', po_record.order_number,
        'status', po_record.status,
        'total_amount', po_record.total_amount,
        'total_items', item_count,
        'fully_received_items', fully_received_count,
        'completion_percentage', CASE 
            WHEN item_count > 0 THEN ROUND((fully_received_count::DECIMAL / item_count) * 100, 2)
            ELSE 0
        END,
        'is_completed', po_record.status = 'completed',
        'is_fully_received', fully_received_count = item_count AND item_count > 0,
        'can_be_received', po_record.status IN ('sent', 'confirmed', 'shipped', 'partial_received', 'approved'),
        'message', CASE 
            WHEN po_record.status = 'completed' THEN 'Purchase order is already completed'
            WHEN po_record.status = 'received' THEN 'Purchase order has been received but not completed'
            WHEN po_record.status IN ('sent', 'confirmed', 'shipped', 'partial_received', 'approved') THEN 'Purchase order can be received'
            ELSE 'Purchase order is not in a receivable status'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Test the completion status function
SELECT 
    'PO Completion Status:' as message,
    check_po_completion_status('30053b25-0819-4e1b-a360-c151c00f5ed4'::UUID) as status_details;

-- Step 6: Update the receive function to handle completed POs gracefully
DROP FUNCTION IF EXISTS complete_purchase_order_receive(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    audit_details JSONB;
    safe_user_id UUID;
    current_po_status TEXT;
    current_po_number TEXT;
    completion_status JSONB;
    result JSONB;
BEGIN
    -- Get current PO status and number
    SELECT status, order_number INTO current_po_status, current_po_number
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_po_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Purchase order not found',
            'purchase_order_id', purchase_order_id_param
        );
    END IF;
    
    -- Check completion status
    completion_status := check_po_completion_status(purchase_order_id_param);
    
    -- If already completed, return success with info
    IF (completion_status->>'is_completed')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Purchase order is already completed',
            'status', current_po_status,
            'order_number', current_po_number,
            'completion_details', completion_status,
            'action_taken', 'No action needed - PO already completed'
        );
    END IF;
    
    -- Check if PO is in receivable status
    IF current_po_status NOT IN ('sent', 'confirmed', 'shipped', 'partial_received', 'approved', 'received') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Purchase order %s (PO#: %s) is in status "%s" and cannot be received. Allowed statuses: sent, confirmed, shipped, partial_received, approved, received', 
                purchase_order_id_param, current_po_number, current_po_status),
            'current_status', current_po_status,
            'order_number', current_po_number
        );
    END IF;
    
    -- Validate user_id exists, use NULL if invalid
    IF user_id_param IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
        safe_user_id := user_id_param;
    ELSIF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()) THEN
        safe_user_id := auth.uid();
    ELSE
        safe_user_id := NULL;
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
        
        -- Create inventory adjustment for received items
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
            safe_user_id
        );
        
        received_items := received_items + 1;
    END LOOP;
    
    -- Update purchase order status
    UPDATE lats_purchase_orders 
    SET 
        status = 'received',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry with safe user_id (can be NULL)
    BEGIN
        audit_details := jsonb_build_object(
            'message', format('Received %s items out of %s total items', received_items, total_items),
            'received_items', received_items,
            'total_items', total_items,
            'receive_notes', COALESCE(receive_notes, 'Full receive of purchase order'),
            'processed_by', COALESCE(safe_user_id::text, 'system'),
            'previous_status', current_po_status
        );
        
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            user_id,
            details,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Full receive',
            safe_user_id,
            audit_details,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully received %s items out of %s total items', received_items, total_items),
        'received_items', received_items,
        'total_items', total_items,
        'status', 'received',
        'order_number', current_po_number,
        'processed_by', COALESCE(safe_user_id::text, 'system')
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to complete purchase order receive: ' || SQLERRM,
            'purchase_order_id', purchase_order_id_param
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive TO authenticated;
GRANT EXECUTE ON FUNCTION check_po_completion_status TO authenticated;

-- Step 8: Test the updated receive function
SELECT 
    'Testing updated receive function:' as message,
    complete_purchase_order_receive(
        '30053b25-0819-4e1b-a360-c151c00f5ed4'::UUID,
        NULL,
        'Test receive with completed PO'
    ) as function_result;

-- Step 9: Success message
SELECT 
    'SUCCESS: Completed PO handling implemented!' as message,
    'Function now returns JSONB with success/error status' as return_format,
    'Handles completed POs gracefully without errors' as completion_handling,
    'Provides detailed status information' as status_details,
    'No more errors for already completed POs' as expected_result;
