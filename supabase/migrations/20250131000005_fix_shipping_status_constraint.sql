-- Migration: Fix Shipping Status Constraint
-- This migration ensures the shipping status constraint includes all new statuses

-- =====================================================
-- UPDATE SHIPPING STATUS CONSTRAINTS
-- =====================================================

-- First, drop the existing constraint if it exists
ALTER TABLE lats_shipping_info DROP CONSTRAINT IF EXISTS lats_shipping_info_status_check;

-- Add the new constraint with all statuses including the new workflow statuses
ALTER TABLE lats_shipping_info ADD CONSTRAINT lats_shipping_info_status_check 
CHECK (status IN (
  'pending', 
  'picked_up', 
  'in_transit', 
  'out_for_delivery', 
  'delivered', 
  'exception',
  'arrived',
  'received'
));

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.status IS 'Shipping status: pending, picked_up, in_transit, out_for_delivery, delivered, exception, arrived, received';

-- Add missing columns if they don't exist
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS products_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS inventory_received_at TIMESTAMP WITH TIME ZONE;

-- Add comments for new columns
COMMENT ON COLUMN lats_shipping_info.products_updated_at IS 'Timestamp when product details were last updated (status = arrived)';
COMMENT ON COLUMN lats_shipping_info.inventory_received_at IS 'Timestamp when shipment was received into inventory (status = received)';
