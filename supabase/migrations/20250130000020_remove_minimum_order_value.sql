-- Remove minimum_order_value column from lats_shipping_agents table
-- This migration removes the minimum order value field as requested

-- Drop the minimum_order_value column
ALTER TABLE lats_shipping_agents DROP COLUMN IF EXISTS minimum_order_value;

-- Add comment for documentation
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table - minimum order value field removed';
