-- Enhance Receive Functionality
-- This migration adds comprehensive receive and returns handling

-- =====================================================
-- CREATE RETURNS AND DAMAGE TRACKING TABLES
-- =====================================================

-- Create purchase order returns table
CREATE TABLE IF NOT EXISTS lats_purchase_order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('damage', 'defect', 'wrong_item', 'excess', 'other')),
    return_quantity INTEGER NOT NULL CHECK (return_quantity > 0),
    return_reason TEXT,
    return_date TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    supplier_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory adjustments table for receive operations
CREATE TABLE IF NOT EXISTS lats_inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('receive', 'return', 'damage', 'adjustment')),
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2),
    reason TEXT,
    reference_id UUID, -- Links to purchase order item or return
    processed_by UUID,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_returns_po_id 
    ON lats_purchase_order_returns(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_returns_item_id 
    ON lats_purchase_order_returns(item_id);

CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_returns_status 
    ON lats_purchase_order_returns(status);

CREATE INDEX IF NOT EXISTS idx_lats_inventory_adjustments_po_id 
    ON lats_inventory_adjustments(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_lats_inventory_adjustments_product_id 
    ON lats_inventory_adjustments(product_id);

CREATE INDEX IF NOT EXISTS idx_lats_inventory_adjustments_type 
    ON lats_inventory_adjustments(adjustment_type);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE lats_purchase_order_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read purchase order returns" ON lats_purchase_order_returns
    FOR SELECT USING (true);

CREATE POLICY "Users can insert purchase order returns" ON lats_purchase_order_returns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update purchase order returns" ON lats_purchase_order_returns
    FOR UPDATE USING (true);

CREATE POLICY "Users can read inventory adjustments" ON lats_inventory_adjustments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert inventory adjustments" ON lats_inventory_adjustments
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- ENHANCED RECEIVE FUNCTIONS
-- =====================================================

-- Function to complete full receive of a purchase order
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
        AND status IN ('confirmed', 'shipped', 'partial_received')
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
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        details,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'Full receive',
        user_id_param,
        format('Received %s items out of %s total items', received_items, total_items),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to complete purchase order receive: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process returns
CREATE OR REPLACE FUNCTION process_purchase_order_return(
    purchase_order_id_param UUID,
    item_id_param UUID,
    return_type_param VARCHAR(20),
    return_quantity_param INTEGER,
    return_reason_param TEXT,
    user_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
    item_record RECORD;
    current_received INTEGER;
BEGIN
    -- Validate item exists and belongs to purchase order
    SELECT poi.id, poi.product_id, poi.variant_id, poi.quantity, poi.received_quantity, poi.cost_price
    INTO item_record
    FROM lats_purchase_order_items poi
    WHERE poi.id = item_id_param 
    AND poi.purchase_order_id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item % not found in purchase order %', item_id_param, purchase_order_id_param;
    END IF;
    
    current_received := COALESCE(item_record.received_quantity, 0);
    
    -- Validate return quantity
    IF return_quantity_param <= 0 THEN
        RAISE EXCEPTION 'Return quantity must be greater than 0';
    END IF;
    
    IF return_quantity_param > current_received THEN
        RAISE EXCEPTION 'Return quantity % cannot exceed received quantity %', return_quantity_param, current_received;
    END IF;
    
    -- Create return record
    INSERT INTO lats_purchase_order_returns (
        purchase_order_id,
        item_id,
        return_type,
        return_quantity,
        return_reason,
        processed_by,
        status
    ) VALUES (
        purchase_order_id_param,
        item_id_param,
        return_type_param,
        return_quantity_param,
        return_reason_param,
        user_id_param,
        'pending'
    );
    
    -- Update received quantity
    UPDATE lats_purchase_order_items 
    SET 
        received_quantity = current_received - return_quantity_param,
        updated_at = NOW()
    WHERE id = item_id_param;
    
    -- Create inventory adjustment for return
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
        item_record.product_id,
        item_record.variant_id,
        'return',
        -return_quantity_param, -- Negative quantity for return
        item_record.cost_price,
        format('Return: %s - %s', return_type_param, return_reason_param),
        item_id_param,
        user_id_param
    );
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        details,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'Return processed',
        user_id_param,
        format('Returned %s items of type %s: %s', return_quantity_param, return_type_param, return_reason_param),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process return: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get purchase order receive summary
CREATE OR REPLACE FUNCTION get_purchase_order_receive_summary(purchase_order_id_param UUID)
RETURNS TABLE (
    total_items INTEGER,
    total_quantity INTEGER,
    received_quantity INTEGER,
    pending_quantity INTEGER,
    return_count INTEGER,
    return_quantity INTEGER,
    completion_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(poi.id)::INTEGER as total_items,
        SUM(poi.quantity)::INTEGER as total_quantity,
        SUM(COALESCE(poi.received_quantity, 0))::INTEGER as received_quantity,
        SUM(poi.quantity - COALESCE(poi.received_quantity, 0))::INTEGER as pending_quantity,
        COUNT(por.id)::INTEGER as return_count,
        SUM(COALESCE(por.return_quantity, 0))::INTEGER as return_quantity,
        CASE 
            WHEN SUM(poi.quantity) > 0 THEN 
                (SUM(COALESCE(poi.received_quantity, 0))::DECIMAL / SUM(poi.quantity)::DECIMAL) * 100
            ELSE 0 
        END as completion_percentage
    FROM lats_purchase_order_items poi
    LEFT JOIN lats_purchase_order_returns por ON poi.id = por.item_id
    WHERE poi.purchase_order_id = purchase_order_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get returns for a purchase order
CREATE OR REPLACE FUNCTION get_purchase_order_returns(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    item_id UUID,
    product_name TEXT,
    variant_name TEXT,
    return_type VARCHAR(20),
    return_quantity INTEGER,
    return_reason TEXT,
    return_date TIMESTAMPTZ,
    status VARCHAR(20),
    supplier_response TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        por.id,
        por.item_id,
        p.name as product_name,
        pv.name as variant_name,
        por.return_type,
        por.return_quantity,
        por.return_reason,
        por.return_date,
        por.status,
        por.supplier_response
    FROM lats_purchase_order_returns por
    JOIN lats_purchase_order_items poi ON por.item_id = poi.id
    LEFT JOIN lats_products p ON poi.product_id = p.id
    LEFT JOIN lats_product_variants pv ON poi.variant_id = pv.id
    WHERE por.purchase_order_id = purchase_order_id_param
    ORDER BY por.return_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION complete_purchase_order_receive(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_purchase_order_return(UUID, UUID, VARCHAR(20), INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_receive_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_returns(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced receive functionality migration completed successfully';
    RAISE NOTICE '📋 New tables created:';
    RAISE NOTICE '   - lats_purchase_order_returns';
    RAISE NOTICE '   - lats_inventory_adjustments';
    RAISE NOTICE '🔧 New functions created:';
    RAISE NOTICE '   - complete_purchase_order_receive()';
    RAISE NOTICE '   - process_purchase_order_return()';
    RAISE NOTICE '   - get_purchase_order_receive_summary()';
    RAISE NOTICE '   - get_purchase_order_returns()';
END $$;
