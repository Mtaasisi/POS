-- Fix quality check inventory RPC function
-- This script creates the missing RPC function for adding quality checked items to inventory

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_quality_checked_items_to_inventory(UUID, UUID, UUID, DECIMAL, TEXT);

-- Create the RPC function to add quality checked items to inventory
CREATE OR REPLACE FUNCTION add_quality_checked_items_to_inventory(
    p_quality_check_id UUID,
    p_purchase_order_id UUID,
    p_user_id UUID,
    p_profit_margin_percentage DECIMAL(5,2) DEFAULT 30.0,
    p_default_location TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    items_added INTEGER := 0;
    total_value DECIMAL(15,2) := 0;
    qc_item RECORD;
    product_record RECORD;
    variant_record RECORD;
    selling_price DECIMAL(15,2);
    inventory_item_id UUID;
BEGIN
    -- Initialize result
    result := jsonb_build_object(
        'success', false,
        'message', 'Processing items...',
        'items_added', 0,
        'total_value', 0
    );

    -- Process each quality check item that passed
    FOR qc_item IN 
        SELECT 
            qci.id,
            qci.purchase_order_item_id,
            qci.result,
            qci.quantity_passed,
            qci.quantity_failed,
            qci.notes,
            poi.product_id,
            poi.variant_id,
            poi.quantity as ordered_quantity,
            poi.cost_price,
            p.name as product_name,
            p.sku as product_sku,
            pv.name as variant_name,
            pv.sku as variant_sku
        FROM lats_quality_check_items qci
        JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
        LEFT JOIN lats_products p ON poi.product_id = p.id
        LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
        WHERE qci.quality_check_id = p_quality_check_id
        AND qci.result = 'pass'
        AND qci.quantity_passed > 0
    LOOP
        -- Calculate selling price with profit margin
        selling_price := qc_item.cost_price * (1 + (p_profit_margin_percentage / 100));
        
        -- Update or create product if it doesn't exist
        IF qc_item.product_id IS NULL THEN
            -- Create new product
            INSERT INTO lats_products (
                name, 
                sku, 
                category_id, 
                status, 
                created_by, 
                created_at, 
                updated_at
            ) VALUES (
                qc_item.product_name,
                qc_item.product_sku,
                (SELECT id FROM lats_categories WHERE name = 'Business Laptops' LIMIT 1),
                'active',
                p_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO product_record.id;
            
            -- Create default variant
            INSERT INTO lats_product_variants (
                product_id,
                name,
                sku,
                quantity,
                cost_price,
                selling_price,
                status,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                product_record.id,
                qc_item.variant_name,
                qc_item.variant_sku,
                qc_item.quantity_passed,
                qc_item.cost_price,
                selling_price,
                'active',
                p_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO variant_record.id;
        ELSE
            -- Update existing product status to active
            UPDATE lats_products 
            SET 
                status = 'active',
                updated_at = NOW()
            WHERE id = qc_item.product_id;
            
            -- Update or create variant
            SELECT id INTO variant_record.id 
            FROM lats_product_variants 
            WHERE product_id = qc_item.product_id 
            AND (qc_item.variant_id IS NULL OR id = qc_item.variant_id)
            LIMIT 1;
            
            IF variant_record.id IS NULL THEN
                -- Create new variant
                INSERT INTO lats_product_variants (
                    product_id,
                    name,
                    sku,
                    quantity,
                    cost_price,
                    selling_price,
                    status,
                    created_by,
                    created_at,
                    updated_at
                ) VALUES (
                    qc_item.product_id,
                    qc_item.variant_name,
                    qc_item.variant_sku,
                    qc_item.quantity_passed,
                    qc_item.cost_price,
                    selling_price,
                    'active',
                    p_user_id,
                    NOW(),
                    NOW()
                ) RETURNING id INTO variant_record.id;
            ELSE
                -- Update existing variant
                UPDATE lats_product_variants 
                SET 
                    quantity = quantity + qc_item.quantity_passed,
                    cost_price = qc_item.cost_price,
                    selling_price = selling_price,
                    status = 'active',
                    updated_at = NOW()
                WHERE id = variant_record.id;
            END IF;
        END IF;
        
        -- Create inventory items for each passed item
        FOR i IN 1..qc_item.quantity_passed LOOP
            INSERT INTO lats_inventory_items (
                product_id,
                variant_id,
                purchase_order_id,
                status,
                location,
                cost_price,
                selling_price,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                COALESCE(qc_item.product_id, product_record.id),
                variant_record.id,
                p_purchase_order_id,
                'available',
                p_default_location,
                qc_item.cost_price,
                selling_price,
                p_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO inventory_item_id;
            
            items_added := items_added + 1;
            total_value := total_value + selling_price;
        END LOOP;
        
        -- Update purchase order item received quantity
        UPDATE lats_purchase_order_items 
        SET 
            received_quantity = COALESCE(received_quantity, 0) + qc_item.quantity_passed,
            updated_at = NOW()
        WHERE id = qc_item.purchase_order_item_id;
    END LOOP;
    
    -- Update purchase order status to received
    UPDATE lats_purchase_orders 
    SET 
        status = 'received',
        updated_at = NOW()
    WHERE id = p_purchase_order_id;
    
    -- Return success result
    result := jsonb_build_object(
        'success', true,
        'message', 'Successfully added ' || items_added || ' items to inventory',
        'items_added', items_added,
        'total_value', total_value
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := jsonb_build_object(
            'success', false,
            'message', 'Error adding items to inventory: ' || SQLERRM,
            'items_added', 0,
            'total_value', 0
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_quality_checked_items_to_inventory(UUID, UUID, UUID, DECIMAL, TEXT) TO authenticated;

SELECT 'Quality check inventory RPC function created successfully!' as status;
