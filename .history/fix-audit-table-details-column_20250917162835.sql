-- Fix the audit table details column type mismatch
-- This addresses the "column details is of type jsonb but expression is of type text" error

-- First, let's check if the table exists and what type the details column is
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Check if the audit table exists and get the details column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'lats_purchase_order_audit' 
    AND column_name = 'details'
    AND table_schema = 'public';
    
    IF column_type IS NOT NULL THEN
        RAISE NOTICE 'Current details column type: %', column_type;
        
        -- If it's JSONB, we need to update our function to use JSONB
        IF column_type = 'jsonb' THEN
            RAISE NOTICE 'Details column is JSONB - function needs to be updated';
        ELSIF column_type = 'text' THEN
            RAISE NOTICE 'Details column is TEXT - no changes needed';
        END IF;
    ELSE
        RAISE NOTICE 'Audit table or details column not found';
    END IF;
END $$;

-- Create or replace the receive function with proper JSONB handling
CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    audit_details JSONB;
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
    
    -- Add audit entry with proper JSONB format
    BEGIN
        -- Create JSONB object for audit details
        audit_details := jsonb_build_object(
            'action', 'Full receive',
            'received_items', received_items,
            'total_items', total_items,
            'receive_notes', COALESCE(receive_notes, 'Full receive of purchase order'),
            'timestamp', NOW()
        );
        
        INSERT INTO lats_purchase_order_audit (
            purchase_order_id,
            action,
            details,
            user_id,
            created_at
        ) VALUES (
            purchase_order_id_param,
            'Full receive',
            audit_details,
            user_id_param,
            NOW()
        );
    EXCEPTION
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
    RAISE NOTICE 'Receive function updated with proper JSONB handling';
    RAISE NOTICE 'Audit details will be stored as JSONB objects';
    RAISE NOTICE 'Function should now work without type mismatch errors';
END $$;
