-- Complete fix for inventory connection after purchase order receive
-- This ensures received items are properly connected to the inventory system

-- 1. First, ensure the stock movements table exists
CREATE TABLE IF NOT EXISTS lats_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_product_id ON lats_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_variant_id ON lats_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_type ON lats_stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_created_at ON lats_stock_movements(created_at);

-- 3. Enable RLS
ALTER TABLE lats_stock_movements ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can read stock movements" ON lats_stock_movements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert stock movements" ON lats_stock_movements
    FOR INSERT WITH CHECK (true);

-- 5. Update the receive function with proper inventory updates
CREATE OR REPLACE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    current_variant_quantity INTEGER;
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
        
        -- Update product variant quantity (KEY FIX)
        IF order_item.variant_id IS NOT NULL THEN
            -- Get current variant quantity
            SELECT quantity INTO current_variant_quantity
            FROM lats_product_variants
            WHERE id = order_item.variant_id;
            
            -- Update variant quantity
            UPDATE lats_product_variants 
            SET 
                quantity = COALESCE(current_variant_quantity, 0) + order_item.quantity,
                updated_at = NOW()
            WHERE id = order_item.variant_id;
            
            -- Create stock movement record
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
                order_item.product_id,
                order_item.variant_id,
                'in',
                order_item.quantity,
                COALESCE(current_variant_quantity, 0),
                COALESCE(current_variant_quantity, 0) + order_item.quantity,
                'Purchase order receive',
                purchase_order_id_param::TEXT,
                COALESCE(receive_notes, 'Full receive of purchase order'),
                user_id_param
            );
        END IF;
        
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
    
    -- Try to add audit entry
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
            jsonb_build_object(
                'received_items', received_items,
                'total_items', total_items,
                'inventory_updated', true,
                'notes', COALESCE(receive_notes, 'Full receive of purchase order')
            ),
            user_id_param,
            NOW()
        );
    EXCEPTION
        WHEN datatype_mismatch THEN
            INSERT INTO lats_purchase_order_audit (
                purchase_order_id,
                action,
                details,
                user_id,
                created_at
            ) VALUES (
                purchase_order_id_param,
                'Full receive',
                format('Received %s items out of %s total items (inventory updated)', received_items, total_items),
                user_id_param,
                NOW()
            );
        WHEN undefined_table THEN
            RAISE NOTICE 'Audit table not found, skipping audit entry';
        WHEN OTHERS THEN
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

-- 6. Create a function to check inventory connection
CREATE OR REPLACE FUNCTION check_inventory_connection(purchase_order_id_param UUID)
RETURNS TABLE (
    product_name TEXT,
    variant_name TEXT,
    ordered_quantity INTEGER,
    received_quantity INTEGER,
    current_stock INTEGER,
    inventory_connected BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        pv.name as variant_name,
        poi.quantity as ordered_quantity,
        poi.received_quantity,
        pv.quantity as current_stock,
        (poi.received_quantity > 0 AND pv.quantity >= poi.received_quantity) as inventory_connected
    FROM lats_purchase_order_items poi
    JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE poi.purchase_order_id = purchase_order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_inventory_connection TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Inventory connection fix applied successfully!';
    RAISE NOTICE 'Key improvements:';
    RAISE NOTICE '  - Stock movements table created/updated';
    RAISE NOTICE '  - Receive function now updates product variant quantities';
    RAISE NOTICE '  - Stock movement records are created for tracking';
    RAISE NOTICE '  - Inventory adjustments are still created for reporting';
    RAISE NOTICE '  - Added check_inventory_connection function for verification';
    RAISE NOTICE 'Received items will now be properly connected to inventory!';
END $$;
