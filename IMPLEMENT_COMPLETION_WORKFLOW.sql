-- =====================================================
-- IMPLEMENT COMPLETION WORKFLOW AFTER RECEIVING
-- =====================================================
-- This script implements the missing "completed" status workflow

-- Step 1: Add completion function
CREATE OR REPLACE FUNCTION complete_purchase_order(
    purchase_order_id_param UUID,
    user_id_param UUID,
    completion_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    order_record RECORD;
    total_items INTEGER := 0;
    completed_items INTEGER := 0;
    completion_details JSONB;
BEGIN
    -- Validate purchase order exists and is in received status
    SELECT id, order_number, status, total_amount, supplier_id
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    IF order_record.status != 'received' THEN
        RAISE EXCEPTION 'Purchase order % is not in received status (current: %)', 
            purchase_order_id_param, order_record.status;
    END IF;
    
    -- Count total items and completed items
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN received_quantity >= quantity THEN 1 END) as completed
    INTO total_items, completed_items
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = purchase_order_id_param;
    
    -- Check if all items are fully received
    IF completed_items < total_items THEN
        RAISE EXCEPTION 'Cannot complete order: % of % items fully received', 
            completed_items, total_items;
    END IF;
    
    -- Update purchase order status to completed
    UPDATE lats_purchase_orders 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Create completion details
    completion_details := jsonb_build_object(
        'purchase_order_id', purchase_order_id_param,
        'order_number', order_record.order_number,
        'total_items', total_items,
        'completed_items', completed_items,
        'completion_date', NOW(),
        'completed_by', user_id_param,
        'completion_notes', completion_notes,
        'status', 'completed'
    );
    
    -- Add audit entry
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by,
        timestamp
    ) VALUES (
        purchase_order_id_param,
        'order_completed',
        completion_details,
        user_id_param,
        user_id_param,
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Purchase order completed successfully',
        'data', completion_details
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add auto-completion trigger
CREATE OR REPLACE FUNCTION auto_complete_purchase_order()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    order_id UUID;
BEGIN
    -- Get the purchase order ID
    order_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    -- Count total items and completed items
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN received_quantity >= quantity THEN 1 END) as completed
    INTO total_items, completed_items
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = order_id;
    
    -- Auto-complete if all items are fully received and status is 'received'
    IF completed_items = total_items AND total_items > 0 THEN
        UPDATE lats_purchase_orders 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE id = order_id 
        AND status = 'received';
        
        -- Add audit entry for auto-completion
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            details,
            user_id,
            created_by,
            timestamp
        ) VALUES (
            order_id,
            'order_auto_completed',
            jsonb_build_object(
                'total_items', total_items,
                'completed_items', completed_items,
                'auto_completion_date', NOW()
            ),
            '00000000-0000-0000-0000-000000000000'::UUID, -- System user
            '00000000-0000-0000-0000-000000000000'::UUID,
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for auto-completion
DROP TRIGGER IF EXISTS trigger_auto_complete_purchase_order ON lats_purchase_order_items;
CREATE TRIGGER trigger_auto_complete_purchase_order
    AFTER UPDATE OF received_quantity ON lats_purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_complete_purchase_order();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order(UUID, UUID, TEXT) TO authenticated;

-- Step 5: Test the completion workflow
SELECT 
    'COMPLETION WORKFLOW IMPLEMENTED' as status,
    'Auto-completion trigger created' as auto_completion,
    'Manual completion function available' as manual_completion,
    'Next: Test with existing received orders' as next_step;
