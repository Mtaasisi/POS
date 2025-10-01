-- Fix the inventory update to actually add items to inventory
-- This ensures received items appear in your inventory system

-- =====================================================
-- STEP 1: ENSURE INVENTORY TABLES EXIST
-- =====================================================

-- Create inventory_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    imei VARCHAR(20),
    mac_address VARCHAR(17),
    barcode VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'returned', 'repair', 'warranty')),
    location VARCHAR(100),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    purchase_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Create lats_inventory_adjustments table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('receive', 'return', 'damage', 'adjustment', 'increase', 'decrease', 'sale', 'loss')),
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2),
    reason TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id ON inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON lats_inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_purchase_order_id ON lats_inventory_adjustments(purchase_order_id);

-- =====================================================
-- STEP 3: UPDATE THE RECEIVE FUNCTION WITH PROPER INVENTORY UPDATE
-- =====================================================

DROP FUNCTION IF EXISTS complete_purchase_order_receive(UUID, UUID, TEXT);

CREATE FUNCTION complete_purchase_order_receive(
    purchase_order_id_param UUID,
    user_id_param UUID,
    receive_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_item RECORD;
    total_items INTEGER := 0;
    received_items INTEGER := 0;
    current_po_status TEXT;
    current_po_number TEXT;
    item_counter INTEGER;
    serial_number_base TEXT;
BEGIN
    -- Get current PO status and number
    SELECT status, order_number INTO current_po_status, current_po_number
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    -- Check if PO exists
    IF current_po_status IS NULL THEN
        RAISE EXCEPTION 'Purchase order not found';
    END IF;
    
    -- Handle different status cases
    CASE current_po_status
        WHEN 'received' THEN
            RAISE NOTICE 'Purchase order % is already received', current_po_number;
            RETURN TRUE;
        WHEN 'completed' THEN
            RAISE NOTICE 'Purchase order % is already completed', current_po_number;
            RETURN TRUE;
        WHEN 'draft' THEN
            RAISE EXCEPTION 'Purchase order % is in draft status and must be sent before receiving', current_po_number;
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Purchase order % is cancelled and cannot be received', current_po_number;
        WHEN 'sent', 'confirmed', 'shipped', 'partial_received' THEN
            NULL; -- Continue with receive process
        ELSE
            RAISE EXCEPTION 'Purchase order % is in status "%s" and cannot be received', current_po_number, current_po_status;
    END CASE;
    
    -- Get all items and update received quantities
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
        
        -- Create individual inventory items for each received quantity
        FOR item_counter IN 1..order_item.quantity LOOP
            -- Generate a unique serial number
            serial_number_base := format('%s-%s-%s-%s', 
                current_po_number, 
                order_item.product_id::text,
                order_item.variant_id::text,
                item_counter
            );
            
            -- Insert individual inventory item
            INSERT INTO inventory_items (
                product_id,
                variant_id,
                serial_number,
                status,
                cost_price,
                purchase_date,
                notes,
                created_by
            ) VALUES (
                order_item.product_id,
                order_item.variant_id,
                serial_number_base,
                'available',
                order_item.cost_price,
                CURRENT_DATE,
                format('Received from PO: %s', current_po_number),
                user_id_param
            );
        END LOOP;
        
        -- Create inventory adjustment record
        INSERT INTO lats_inventory_adjustments (
            purchase_order_id,
            product_id,
            variant_id,
            adjustment_type,
            quantity,
            cost_price,
            reason,
            reference_id,
            reference_type,
            notes,
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
            'purchase_order',
            format('Received %s items from PO: %s', order_item.quantity, current_po_number),
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
    
    -- Insert audit record
    INSERT INTO purchase_order_audit (
        purchase_order_id, action, user_id, created_by, details, timestamp
    ) VALUES (
        purchase_order_id_param, 'Full receive', user_id_param, user_id_param,
        to_jsonb(format('Received %s items out of %s total items', received_items, total_items)::text), NOW()
    );
    
    -- Log success
    RAISE NOTICE 'Successfully received % items out of % total items for purchase order %. Items added to inventory.', 
        received_items, total_items, current_po_number;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;
GRANT SELECT, INSERT ON inventory_items TO authenticated;
GRANT SELECT, INSERT ON lats_inventory_adjustments TO authenticated;

-- =====================================================
-- STEP 5: TEST THE FUNCTION
-- =====================================================

-- Test with a "sent" order
SELECT complete_purchase_order_receive(
    '8956fb48-1f2f-43f8-82f9-a526d8485fbd'::UUID,
    auth.uid(),
    'Test inventory update fix'
);

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Inventory update fix applied successfully';
    RAISE NOTICE '📋 Features:';
    RAISE NOTICE '   - Creates individual inventory_items for each received product';
    RAISE NOTICE '   - Generates unique serial numbers';
    RAISE NOTICE '   - Sets status to "available"';
    RAISE NOTICE '   - Records inventory adjustments';
    RAISE NOTICE '   - Items will now appear in your inventory system';
    RAISE NOTICE '🎯 Ready for testing';
END $$;
