-- Migration: Fix Purchase Orders - Add Shipping Fields and Status Updates
-- This migration adds missing shipping fields and fixes status constraints for purchase orders

-- =====================================================
-- ADD SHIPPING FIELDS TO PURCHASE ORDERS
-- =====================================================

-- Add shipping-related fields to purchase orders table
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipped_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- UPDATE STATUS CONSTRAINTS
-- =====================================================

-- Drop existing status constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add updated status constraint with shipping statuses
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'sent', 'confirmed', 'shipping', 'shipped', 'received', 'cancelled'));

-- Add shipping status constraint
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_shipping_status_check 
CHECK (shipping_status IN ('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'returned'));

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