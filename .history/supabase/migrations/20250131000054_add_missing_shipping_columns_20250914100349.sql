-- Add missing shipping columns to lats_purchase_orders table
-- This fixes the 400 Bad Request error when creating purchase orders

-- =====================================================
-- ADD MISSING SHIPPING COLUMNS
-- =====================================================

-- Add tracking_number column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add shipping_status column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';

-- Add estimated_delivery_date column (different from expected_delivery)
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- Add shipping_notes column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_notes TEXT;

-- Add shipping_info column as JSONB for complex shipping data
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}';

-- Add shipped_date column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipped_date DATE;

-- Add delivered_date column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS delivered_date DATE;

-- Add shipping_date column
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_date DATE;

-- =====================================================
-- ADD CONSTRAINTS
-- =====================================================

-- Add check constraint for shipping_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_shipping_status' 
        AND table_name = 'lats_purchase_orders'
    ) THEN
        ALTER TABLE lats_purchase_orders 
        ADD CONSTRAINT check_shipping_status 
        CHECK (shipping_status IN ('pending', 'shipped', 'in_transit', 'delivered', 'cancelled'));
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index for tracking_number queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tracking_number ON lats_purchase_orders(tracking_number);

-- Add index for shipping_status queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_status ON lats_purchase_orders(shipping_status);

-- Add index for estimated_delivery_date queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_estimated_delivery_date ON lats_purchase_orders(estimated_delivery_date);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.tracking_number IS 'Tracking number for the shipment';
COMMENT ON COLUMN lats_purchase_orders.shipping_status IS 'Current status of the shipment (pending, shipped, in_transit, delivered, cancelled)';
COMMENT ON COLUMN lats_purchase_orders.estimated_delivery_date IS 'Estimated delivery date for the shipment';
COMMENT ON COLUMN lats_purchase_orders.shipping_notes IS 'Additional notes about the shipping';
COMMENT ON COLUMN lats_purchase_orders.shipping_info IS 'JSONB object containing detailed shipping information';
COMMENT ON COLUMN lats_purchase_orders.shipped_date IS 'Date when the order was shipped';
COMMENT ON COLUMN lats_purchase_orders.delivered_date IS 'Date when the order was delivered';
COMMENT ON COLUMN lats_purchase_orders.shipping_date IS 'Date when shipping was initiated';

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================

-- Set default shipping_status for existing records
UPDATE lats_purchase_orders 
SET shipping_status = 'pending' 
WHERE shipping_status IS NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Missing shipping columns added to lats_purchase_orders table successfully';
    RAISE NOTICE 'New columns added:';
    RAISE NOTICE '   - tracking_number (TEXT)';
    RAISE NOTICE '   - shipping_status (TEXT)';
    RAISE NOTICE '   - estimated_delivery_date (DATE)';
    RAISE NOTICE '   - shipping_notes (TEXT)';
    RAISE NOTICE '   - shipping_info (JSONB)';
    RAISE NOTICE '   - shipped_date (DATE)';
    RAISE NOTICE '   - delivered_date (DATE)';
    RAISE NOTICE '   - shipping_date (DATE)';
    RAISE NOTICE 'Indexes and constraints created';
    RAISE NOTICE 'Purchase order creation should now work without 400 errors';
END $$;
