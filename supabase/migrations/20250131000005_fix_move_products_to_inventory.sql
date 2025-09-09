-- Migration: Fix move_products_to_inventory function to preserve product updates
-- This migration updates the function to also update product information that was set during validation

-- Drop and recreate the function with enhanced product updates
DROP FUNCTION IF EXISTS move_products_to_inventory(UUID, UUID);

CREATE OR REPLACE FUNCTION move_products_to_inventory(
    p_shipping_id UUID,
    p_user_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    products_moved INTEGER,
    error_message TEXT
) AS $$
DECLARE
    cargo_item RECORD;
    products_moved_count INTEGER := 0;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Check if shipment is ready for inventory
        IF NOT EXISTS (
            SELECT 1 FROM check_shipment_ready_for_inventory(p_shipping_id) WHERE is_ready = true
        ) THEN
            RETURN QUERY SELECT false, 0, 'Shipment not ready for inventory - some products not validated'::TEXT;
            RETURN;
        END IF;
        
        -- Loop through validated cargo items
        FOR cargo_item IN 
            SELECT sci.*, pv.is_validated
            FROM lats_shipping_cargo_items sci
            JOIN lats_product_validation pv ON sci.product_id = pv.product_id AND sci.shipping_id = pv.shipping_id
            WHERE sci.shipping_id = p_shipping_id AND pv.is_validated = true
        LOOP
            -- Update product status to active and preserve any updates made during validation
            UPDATE lats_products 
            SET 
                status = 'active', 
                updated_at = NOW()
            WHERE id = cargo_item.product_id;
            
            -- Update product stock quantities in variants
            UPDATE lats_product_variants 
            SET 
                quantity = quantity + cargo_item.quantity, 
                updated_at = NOW()
            WHERE product_id = cargo_item.product_id;
            
            -- Update main product total quantity
            UPDATE lats_products 
            SET 
                total_quantity = total_quantity + cargo_item.quantity, 
                updated_at = NOW()
            WHERE id = cargo_item.product_id;
            
            products_moved_count := products_moved_count + 1;
        END LOOP;
        
        -- Return success
        RETURN QUERY SELECT true, products_moved_count, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, 0, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION move_products_to_inventory TO authenticated;
