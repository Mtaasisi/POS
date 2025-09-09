-- Migration: Fix move_products_to_inventory function to properly calculate stock movement quantities
-- This migration fixes the issue where previous_quantity and new_quantity were being calculated incorrectly

-- Drop and recreate the function with proper quantity calculations
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
    variant_record RECORD;
    products_moved_count INTEGER := 0;
    error_msg TEXT;
    previous_quantity INTEGER;
    new_quantity INTEGER;
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
            SELECT 
                sci.*, 
                pv.is_validated,
                pv.updated_cost_price,
                pv.updated_selling_price,
                pv.updated_supplier_id,
                pv.updated_category_id,
                pv.updated_product_name,
                pv.updated_product_description
            FROM lats_shipping_cargo_items sci
            JOIN lats_product_validation pv ON sci.product_id = pv.product_id AND sci.shipping_id = pv.shipping_id
            WHERE sci.shipping_id = p_shipping_id AND pv.is_validated = true
        LOOP
            -- Get current variant information BEFORE updating
            SELECT id, quantity INTO variant_record
            FROM lats_product_variants 
            WHERE product_id = cargo_item.product_id 
            LIMIT 1;
            
            -- Store previous quantity
            previous_quantity := variant_record.quantity;
            new_quantity := previous_quantity + cargo_item.quantity;
            
            -- Update product with all validation updates
            UPDATE lats_products 
            SET 
                status = 'active',
                name = COALESCE(cargo_item.updated_product_name, name),
                description = COALESCE(cargo_item.updated_product_description, description),
                supplier_id = COALESCE(cargo_item.updated_supplier_id, supplier_id),
                category_id = COALESCE(cargo_item.updated_category_id, category_id),
                total_quantity = total_quantity + cargo_item.quantity,
                updated_at = NOW()
            WHERE id = cargo_item.product_id;
            
            -- Update product variants with cost price and selling price from validation
            UPDATE lats_product_variants 
            SET 
                quantity = new_quantity,
                cost_price = COALESCE(cargo_item.updated_cost_price, cost_price),
                selling_price = COALESCE(cargo_item.updated_selling_price, selling_price),
                updated_at = NOW()
            WHERE product_id = cargo_item.product_id;
            
            -- Create stock movement record with correct quantities
            INSERT INTO lats_stock_movements (
                product_id,
                variant_id,
                type,
                quantity,
                previous_quantity,
                new_quantity,
                reason,
                reference,
                notes,
                created_by
            ) VALUES (
                cargo_item.product_id,
                variant_record.id,
                'in',
                cargo_item.quantity,
                previous_quantity,
                new_quantity,
                'Shipment received',
                'Shipment received',
                'Product received from shipment with updated pricing and supplier information',
                p_user_id
            );
            
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

-- Add comment explaining the function
COMMENT ON FUNCTION move_products_to_inventory(UUID, UUID) IS 
'Moves validated products from shipping to inventory, preserving all updates made during validation including cost prices, selling prices, supplier information, and product details. Fixed to properly calculate stock movement quantities.';
