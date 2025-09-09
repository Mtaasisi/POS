-- Migration: Fix Purchase Orders - Add Shipping Fields and Status Updates
-- This migration adds missing shipping fields and fixes status constraints for purchase orders

-- =====================================================
-- ADD SHIPPING FIELDS TO PURCHASE ORDERS
-- =====================================================

-- Add shipping-related fields to purchase orders table (only if they don't exist)
DO $$
BEGIN
    -- Add tracking_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'tracking_number') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN tracking_number TEXT;
    END IF;
    
    -- Add shipping_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'shipping_status') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN shipping_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add estimated_delivery_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'estimated_delivery_date') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN estimated_delivery_date DATE;
    END IF;
    
    -- Add shipping_notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'shipping_notes') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN shipping_notes TEXT;
    END IF;
    
    -- Add shipped_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'shipped_date') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN shipped_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add delivered_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'delivered_date') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN delivered_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- UPDATE STATUS CONSTRAINTS
-- =====================================================

-- Drop existing status constraint if it exists
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add updated status constraint with shipping statuses
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'sent', 'confirmed', 'shipping', 'shipped', 'received', 'cancelled'));

-- Handle shipping status constraint more carefully
DO $$
BEGIN
    -- Check if the constraint already exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'lats_purchase_orders' 
               AND constraint_name = 'lats_purchase_orders_shipping_status_check') THEN
        -- Constraint exists, drop it first
        ALTER TABLE lats_purchase_orders DROP CONSTRAINT lats_purchase_orders_shipping_status_check;
    END IF;
    
    -- Now add the constraint
    ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT lats_purchase_orders_shipping_status_check 
    CHECK (shipping_status IN ('not_shipped', 'pending', 'packed', 'shipped', 'in_transit', 'delivered', 'returned'));
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tracking ON lats_purchase_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_status ON lats_purchase_orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_estimated_delivery ON lats_purchase_orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipped_date ON lats_purchase_orders(shipped_date);

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================

-- Set default shipping status for existing orders
UPDATE lats_purchase_orders 
SET 
  shipping_status = 'pending'
WHERE shipping_status IS NULL;

-- For shipped/received orders, update shipping status appropriately
UPDATE lats_purchase_orders 
SET 
  shipping_status = 'delivered'
WHERE status = 'received' AND shipping_status = 'pending';

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.tracking_number IS 'Shipping tracking number from carrier';
COMMENT ON COLUMN lats_purchase_orders.shipping_status IS 'Current shipping status independent of order status';
COMMENT ON COLUMN lats_purchase_orders.estimated_delivery_date IS 'Expected delivery date (can be different from expected_delivery)';
COMMENT ON COLUMN lats_purchase_orders.shipping_notes IS 'Notes related to shipping and delivery';
COMMENT ON COLUMN lats_purchase_orders.shipped_date IS 'Date when order was actually shipped';
COMMENT ON COLUMN lats_purchase_orders.delivered_date IS 'Date when order was delivered/received';