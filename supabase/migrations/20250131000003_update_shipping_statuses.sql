-- Migration: Update Shipping Statuses
-- This migration adds new shipping statuses to support the enhanced shipping workflow

-- =====================================================
-- UPDATE SHIPPING STATUS CONSTRAINTS
-- =====================================================

-- First, drop the existing constraint
ALTER TABLE lats_shipping_info DROP CONSTRAINT IF EXISTS lats_shipping_info_status_check;

-- Add the new constraint with additional statuses
ALTER TABLE lats_shipping_info ADD CONSTRAINT lats_shipping_info_status_check 
CHECK (status IN (
  'pending', 
  'picked_up', 
  'in_transit', 
  'out_for_delivery', 
  'delivered', 
  'exception',
  'arrived',
  'ready_for_inventory',
  'received'
));

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.status IS 'Shipping status: pending, picked_up, in_transit, out_for_delivery, delivered, exception, arrived, ready_for_inventory, received';

-- Update any existing 'delivered' statuses to 'arrived' if they haven't been processed yet
-- This is a one-time migration for existing data
UPDATE lats_shipping_info 
SET status = 'arrived' 
WHERE status = 'delivered' 
AND actual_delivery IS NULL;

-- Add a new column to track when products were last updated
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS products_updated_at TIMESTAMP WITH TIME ZONE;

-- Add a new column to track inventory receipt status
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS inventory_received_at TIMESTAMP WITH TIME ZONE;

-- Add comments for new columns
COMMENT ON COLUMN lats_shipping_info.products_updated_at IS 'Timestamp when product details were last updated (status = arrived)';
COMMENT ON COLUMN lats_shipping_info.inventory_received_at IS 'Timestamp when shipment was received into inventory (status = received)';
