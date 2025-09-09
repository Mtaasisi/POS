-- Migration: Add shipping_info JSONB column to purchase orders table
-- This migration adds a JSONB column to store complete shipping information

-- =====================================================
-- ADD SHIPPING_INFO JSONB COLUMN
-- =====================================================

-- Add shipping_info JSONB column to store complete shipping data
DO $$
BEGIN
    -- Add shipping_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'shipping_info'
    ) THEN
        ALTER TABLE lats_purchase_orders 
        ADD COLUMN shipping_info JSONB DEFAULT '{}';
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add GIN index for JSONB queries on shipping_info
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_info_gin 
ON lats_purchase_orders USING GIN (shipping_info);

-- Add specific indexes for common shipping queries (using B-tree for text fields)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_carrier 
ON lats_purchase_orders ((shipping_info->>'carrier'));

CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_method 
ON lats_purchase_orders ((shipping_info->>'method'));

CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_agent 
ON lats_purchase_orders ((shipping_info->>'agent'));

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.shipping_info IS 'Complete shipping information stored as JSONB including address, method, tracking, costs, and internal shipping details';

-- =====================================================
-- CREATE HELPER FUNCTIONS FOR SHIPPING QUERIES
-- =====================================================

-- Function to get shipping info by purchase order ID
CREATE OR REPLACE FUNCTION get_purchase_order_shipping_info(po_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT shipping_info 
        FROM lats_purchase_orders 
        WHERE id = po_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update shipping info for a purchase order
CREATE OR REPLACE FUNCTION update_purchase_order_shipping_info(
    po_id UUID,
    new_shipping_info JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE lats_purchase_orders 
    SET 
        shipping_info = new_shipping_info,
        updated_at = NOW()
    WHERE id = po_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on the functions
GRANT EXECUTE ON FUNCTION get_purchase_order_shipping_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_purchase_order_shipping_info(UUID, JSONB) TO authenticated;

-- Add comments for the functions
COMMENT ON FUNCTION get_purchase_order_shipping_info(UUID) IS 'Retrieves shipping information for a specific purchase order';
COMMENT ON FUNCTION update_purchase_order_shipping_info(UUID, JSONB) IS 'Updates shipping information for a specific purchase order';