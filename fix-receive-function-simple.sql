-- Simple fix for the receive function that handles both TEXT and JSONB details columns
-- This addresses the "column details is of type jsonb but expression is of type text" error

CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
BEGIN
    -- Validate purchase order exists and is in correct status
    IF NOT EXISTS (
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_id_param 
        AND status IN ('sent', 'confirmed', 'shipped', 'partial_received')
    ) THEN
        RAISE EXCEPTION 'Purchase order % not found or not in receivable status', purchase_order_id_param;
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
            user_id_param
        );
        
        received_items := received_items + 1;
    END LOOP;
    
    -- Update purchase order status
    UPDATE lats_purchase_orders 
    SET 
        status = 'received',
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Try to add audit entry - handle both TEXT and JSONB cases
    BEGIN
        -- First try with JSONB (most recent format)
        INSERT INTO lats_purchase_order_audit (
            purchase_order_id,
            action,
            details,
            user_id,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Full receive',
            jsonb_build_object(
                'received_items', received_items,
                'total_items', total_items,
                'notes', COALESCE(receive_notes, 'Full receive of purchase order')
            ),
            user_id_param,
            NOW()
        );
    EXCEPTION
        WHEN datatype_mismatch THEN
            -- If JSONB fails, try with TEXT
            BEGIN
                INSERT INTO lats_purchase_order_audit (
                    purchase_order_id,
                    action,
                    details,
                    user_id,
                    created_at
                ) VALUES (
                    purchase_order_id_param,
                    'Full receive',
                    format('Received %s items out of %s total items', received_items, total_items),
                    user_id_param,
                    NOW()
                );
            EXCEPTION
                WHEN undefined_table THEN
                    -- Audit table doesn't exist, skip audit entry
                    RAISE NOTICE 'Audit table not found, skipping audit entry';
            END;
        WHEN undefined_table THEN
            -- Audit table doesn't exist, skip audit entry
            RAISE NOTICE 'Audit table not found, skipping audit entry';
        WHEN OTHERS THEN
            -- Other errors, log but don't fail the transaction
            RAISE NOTICE 'Failed to create audit entry: %', SQLERRM;
    END;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_purchase_order_receive TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Receive function updated with flexible audit handling';
    RAISE NOTICE 'Function will work with both TEXT and JSONB details columns';
    RAISE NOTICE 'Purchase orders with "sent" status can now be received';
END $$;
