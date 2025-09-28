-- Fix the update_received_quantities function to use proper JSONB format
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_received_quantities(
    purchase_order_id_param UUID,
    item_updates JSONB,
    user_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
    item_update JSONB;
    item_id UUID;
    new_quantity INTEGER;
    current_quantity INTEGER;
    max_quantity INTEGER;
BEGIN
    -- Validate input
    IF item_updates IS NULL OR jsonb_array_length(item_updates) = 0 THEN
        RAISE EXCEPTION 'No item updates provided';
    END IF;
    
    -- Process each item update
    FOR item_update IN SELECT * FROM jsonb_array_elements(item_updates)
    LOOP
        item_id := (item_update->>'id')::UUID;
        new_quantity := (item_update->>'receivedQuantity')::INTEGER;
        
        -- Get current item details
        SELECT received_quantity, quantity 
        INTO current_quantity, max_quantity
        FROM lats_purchase_order_items 
        WHERE id = item_id AND purchase_order_id = purchase_order_id_param;
        
        -- Validate quantity
        IF new_quantity < 0 OR new_quantity > max_quantity THEN
            RAISE EXCEPTION 'Invalid received quantity % for item %. Must be between 0 and %', 
                new_quantity, item_id, max_quantity;
        END IF;
        
        -- Update the item
        UPDATE lats_purchase_order_items 
        SET 
            received_quantity = new_quantity,
            updated_at = NOW()
        WHERE id = item_id AND purchase_order_id = purchase_order_id_param;
        
        -- Check if update was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item % not found in purchase order %', item_id, purchase_order_id_param;
        END IF;
    END LOOP;
    
    -- Add audit entry with proper JSONB format
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        created_by,
        details,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'Partial receive',
        user_id_param,
        user_id_param,
        json_build_object(
            'message', 'Updated received quantities for items',
            'item_count', jsonb_array_length(item_updates),
            'updates', item_updates
        ),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update received quantities: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_received_quantities(UUID, JSONB, UUID) TO authenticated;
