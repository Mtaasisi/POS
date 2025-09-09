-- Migration: Add Shipping Cost Fields to Products
-- This migration adds shipping cost fields to the lats_products table
-- to support shipping cost calculations and display

-- =====================================================
-- ADD SHIPPING COST FIELDS TO PRODUCTS
-- =====================================================

-- Add shipping cost fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS freight_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customs_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_currency TEXT DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS shipping_cost_per_unit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_per_kg DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_per_cbm DECIMAL(10,2) DEFAULT 0;

-- =====================================================
-- ADD SHIPPING COST FIELDS TO SUPPLIERS
-- =====================================================

-- Add shipping cost fields to lats_suppliers table
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS default_shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_per_kg DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_per_cbm DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,2) DEFAULT 0;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Product shipping cost indexes
CREATE INDEX IF NOT EXISTS idx_lats_products_shipping_cost ON lats_products(shipping_cost);
CREATE INDEX IF NOT EXISTS idx_lats_products_total_shipping_cost ON lats_products(total_shipping_cost);
CREATE INDEX IF NOT EXISTS idx_lats_products_shipping_cost_currency ON lats_products(shipping_cost_currency);

-- Supplier shipping cost indexes
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_default_shipping_cost ON lats_suppliers(default_shipping_cost);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_free_shipping_threshold ON lats_suppliers(free_shipping_threshold);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Product shipping cost fields
COMMENT ON COLUMN lats_products.shipping_cost IS 'Base shipping cost for this product';
COMMENT ON COLUMN lats_products.freight_cost IS 'Freight cost for this product';
COMMENT ON COLUMN lats_products.delivery_cost IS 'Delivery cost for this product';
COMMENT ON COLUMN lats_products.insurance_cost IS 'Insurance cost for this product';
COMMENT ON COLUMN lats_products.customs_cost IS 'Customs/duty cost for this product';
COMMENT ON COLUMN lats_products.handling_cost IS 'Handling cost for this product';
COMMENT ON COLUMN lats_products.total_shipping_cost IS 'Total shipping cost (sum of all shipping costs)';
COMMENT ON COLUMN lats_products.shipping_cost_currency IS 'Currency for shipping costs';
COMMENT ON COLUMN lats_products.shipping_cost_per_unit IS 'Shipping cost per unit';
COMMENT ON COLUMN lats_products.shipping_cost_per_kg IS 'Shipping cost per kilogram';
COMMENT ON COLUMN lats_products.shipping_cost_per_cbm IS 'Shipping cost per cubic meter';

-- Supplier shipping cost fields
COMMENT ON COLUMN lats_suppliers.default_shipping_cost IS 'Default shipping cost for this supplier';
COMMENT ON COLUMN lats_suppliers.shipping_cost_per_kg IS 'Shipping cost per kilogram for this supplier';
COMMENT ON COLUMN lats_suppliers.shipping_cost_per_cbm IS 'Shipping cost per cubic meter for this supplier';
COMMENT ON COLUMN lats_suppliers.minimum_shipping_cost IS 'Minimum shipping cost for this supplier';
COMMENT ON COLUMN lats_suppliers.free_shipping_threshold IS 'Order value threshold for free shipping';

-- =====================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Update existing products with default values
UPDATE lats_products 
SET 
  shipping_cost = 0,
  freight_cost = 0,
  delivery_cost = 0,
  insurance_cost = 0,
  customs_cost = 0,
  handling_cost = 0,
  total_shipping_cost = 0,
  shipping_cost_currency = 'TZS',
  shipping_cost_per_unit = 0,
  shipping_cost_per_kg = 0,
  shipping_cost_per_cbm = 0
WHERE shipping_cost IS NULL 
   OR freight_cost IS NULL 
   OR delivery_cost IS NULL 
   OR insurance_cost IS NULL 
   OR customs_cost IS NULL 
   OR handling_cost IS NULL 
   OR total_shipping_cost IS NULL 
   OR shipping_cost_currency IS NULL 
   OR shipping_cost_per_unit IS NULL 
   OR shipping_cost_per_kg IS NULL 
   OR shipping_cost_per_cbm IS NULL;

-- Update existing suppliers with default values
UPDATE lats_suppliers 
SET 
  default_shipping_cost = 0,
  shipping_cost_per_kg = 0,
  shipping_cost_per_cbm = 0,
  minimum_shipping_cost = 0,
  free_shipping_threshold = 0
WHERE default_shipping_cost IS NULL 
   OR shipping_cost_per_kg IS NULL 
   OR shipping_cost_per_cbm IS NULL 
   OR minimum_shipping_cost IS NULL 
   OR free_shipping_threshold IS NULL;
