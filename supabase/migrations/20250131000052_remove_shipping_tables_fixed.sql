-- Remove all shipping-related tables and functionality
-- This migration completely removes shipping functionality from the app

-- Step 1: Drop the problematic view first
DROP VIEW IF EXISTS shipping_dashboard CASCADE;

-- Step 2: Drop other shipping views
DROP VIEW IF EXISTS lats_shipping_summary CASCADE;
DROP VIEW IF EXISTS lats_shipping_agents_view CASCADE;
DROP VIEW IF EXISTS lats_shipping_agents_with_offices CASCADE;

-- Step 3: Drop shipping tables
DROP TABLE IF EXISTS lats_shipping_info CASCADE;
DROP TABLE IF EXISTS lats_shipping_agents CASCADE;
DROP TABLE IF EXISTS lats_shipping_managers CASCADE;
DROP TABLE IF EXISTS lats_shipping_offices CASCADE;
DROP TABLE IF EXISTS lats_shipping_agent_offices CASCADE;
DROP TABLE IF EXISTS lats_shipping_carriers CASCADE;

-- Step 4: Remove shipping columns from purchase_orders
ALTER TABLE lats_purchase_orders 
DROP COLUMN IF EXISTS tracking_number,
DROP COLUMN IF EXISTS shipping_status,
DROP COLUMN IF EXISTS estimated_delivery_date,
DROP COLUMN IF EXISTS shipping_notes,
DROP COLUMN IF EXISTS shipping_info;

-- Step 5: Remove shipping columns from products
ALTER TABLE lats_products 
DROP COLUMN IF EXISTS shipping_cost,
DROP COLUMN IF EXISTS shipping_weight,
DROP COLUMN IF EXISTS shipping_dimensions,
DROP COLUMN IF EXISTS requires_special_shipping;

-- Step 6: Drop shipping functions
DROP FUNCTION IF EXISTS update_lats_shipping_info_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_lats_shipping_agents_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_lats_shipping_managers_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_lats_shipping_offices_updated_at() CASCADE;

-- Step 7: Drop shipping indexes
DROP INDEX IF EXISTS idx_lats_shipping_info_product_id;
DROP INDEX IF EXISTS idx_lats_shipping_info_purchase_order_id;
DROP INDEX IF EXISTS idx_lats_shipping_info_tracking_number;
DROP INDEX IF EXISTS idx_lats_shipping_info_shipping_status;
DROP INDEX IF EXISTS idx_lats_shipping_info_carrier_name;
DROP INDEX IF EXISTS idx_lats_shipping_info_shipped_date;
DROP INDEX IF EXISTS idx_lats_shipping_agents_name;
DROP INDEX IF EXISTS idx_lats_shipping_agents_contact;
DROP INDEX IF EXISTS idx_lats_shipping_agents_is_active;
