-- Fix Partial Receive Foreign Key Relationships
-- This migration ensures proper foreign key relationships for partial receive functionality

-- =====================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS (if they exist)
-- =====================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS lats_purchase_order_items 
    DROP CONSTRAINT IF EXISTS lats_purchase_order_items_product_id_fkey;

ALTER TABLE IF EXISTS lats_purchase_order_items 
    DROP CONSTRAINT IF EXISTS lats_purchase_order_items_variant_id_fkey;

-- =====================================================
-- ADD PROPER FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for purchase order items to products
ALTER TABLE lats_purchase_order_items 
    ADD CONSTRAINT lats_purchase_order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;

-- Add foreign key constraint for purchase order items to product variants
ALTER TABLE lats_purchase_order_items 
    ADD CONSTRAINT lats_purchase_order_items_variant_id_fkey 
    FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;

-- =====================================================
-- ADD INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Add index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_product_id 
    ON lats_purchase_order_items(product_id);

-- Add index on variant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_variant_id 
    ON lats_purchase_order_items(variant_id);

-- Add index on received_quantity for partial receive queries
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_received_quantity 
    ON lats_purchase_order_items(received_quantity);

-- =====================================================
-- UPDATE RLS POLICIES FOR PARTIAL RECEIVE
-- =====================================================

-- Enable RLS on purchase order items if not already enabled
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for reading purchase order items
DROP POLICY IF EXISTS "Users can read purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can read purchase order items" ON lats_purchase_order_items
    FOR SELECT USING (true);

-- Create policy for updating purchase order items (for partial receive)
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can update purchase order items" ON lats_purchase_order_items
    FOR UPDATE USING (true);

-- =====================================================
-- ADD HELPFUL FUNCTIONS FOR PARTIAL RECEIVE
-- =====================================================

-- Function to get purchase order items with product details
CREATE OR REPLACE FUNCTION get_purchase_order_items_with_products(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    purchase_order_id UUID,
    product_id UUID,
    variant_id UUID,
    quantity INTEGER,
    received_quantity INTEGER,
    cost_price DECIMAL,
    total_price DECIMAL,
    notes TEXT,
    product_name TEXT,
    product_sku TEXT,
    variant_name TEXT,
    variant_sku TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        poi.id,
        poi.purchase_order_id,
        poi.product_id,
        poi.variant_id,
        poi.quantity,
        poi.received_quantity,
        poi.cost_price,
        poi.total_price,
        poi.notes,
        p.name as product_name,
        p.sku as product_sku,
        pv.name as variant_name,
        pv.sku as variant_sku,
        poi.created_at,
        poi.updated_at
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = purchase_order_id_param
    ORDER BY poi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update received quantities with validation
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
    
    -- Add audit entry
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
GRANT EXECUTE ON FUNCTION get_purchase_order_items_with_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_received_quantities(UUID, JSONB, UUID) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify foreign key constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_purchase_order_items_product_id_fkey'
        AND table_name = 'lats_purchase_order_items'
    ) THEN
        RAISE NOTICE '✅ Foreign key constraint for product_id created successfully';
    ELSE
        RAISE NOTICE '❌ Foreign key constraint for product_id failed to create';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_purchase_order_items_variant_id_fkey'
        AND table_name = 'lats_purchase_order_items'
    ) THEN
        RAISE NOTICE '✅ Foreign key constraint for variant_id created successfully';
    ELSE
        RAISE NOTICE '❌ Foreign key constraint for variant_id failed to create';
    END IF;
END $$;
