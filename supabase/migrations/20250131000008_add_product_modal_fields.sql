-- Migration: Add Product Modal Fields
-- This migration adds all the missing fields needed for the enhanced GeneralProductDetailModal
-- including shipping, purchase order, multi-currency, and supplier performance data

-- =====================================================
-- ADD SHIPPING FIELDS TO PRODUCTS
-- =====================================================

-- Add shipping-related fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS length DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS width DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS cbm DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS shipping_class TEXT CHECK (shipping_class IN ('standard', 'fragile', 'hazardous', 'oversized')),
ADD COLUMN IF NOT EXISTS requires_special_handling BOOLEAN DEFAULT false;

-- =====================================================
-- ADD MULTI-CURRENCY FIELDS TO PRODUCTS
-- =====================================================

-- Add multi-currency pricing fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS usd_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS eur_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'TZS';

-- =====================================================
-- ADD PURCHASE ORDER INTEGRATION FIELDS TO PRODUCTS
-- =====================================================

-- Add purchase order related fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_order_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_status TEXT CHECK (order_status IN ('draft', 'sent', 'confirmed', 'processing', 'shipping', 'shipped', 'received', 'cancelled'));

-- =====================================================
-- ADD SHIPPING STATUS FIELDS TO PRODUCTS
-- =====================================================

-- Add shipping status fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS shipping_status TEXT CHECK (shipping_status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS expected_delivery TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipping_agent TEXT,
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;

-- =====================================================
-- ADD SUPPLIER PERFORMANCE FIELDS TO SUPPLIERS
-- =====================================================

-- Add performance fields to lats_suppliers table
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS lead_time INTEGER DEFAULT 0, -- in days
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_rating DECIMAL(3,2) DEFAULT 0 CHECK (quality_rating >= 0 AND quality_rating <= 5);

-- =====================================================
-- ADD STORAGE AND LOCATION FIELDS TO PRODUCTS
-- =====================================================

-- Add storage location fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS storage_room_name TEXT,
ADD COLUMN IF NOT EXISTS shelf_name TEXT,
ADD COLUMN IF NOT EXISTS store_location_name TEXT,
ADD COLUMN IF NOT EXISTS is_refrigerated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_ladder BOOLEAN DEFAULT false;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_lats_products_shipping_status ON lats_products(shipping_status);
CREATE INDEX IF NOT EXISTS idx_lats_products_tracking_number ON lats_products(tracking_number);
CREATE INDEX IF NOT EXISTS idx_lats_products_order_status ON lats_products(order_status);
CREATE INDEX IF NOT EXISTS idx_lats_products_last_order_date ON lats_products(last_order_date);
CREATE INDEX IF NOT EXISTS idx_lats_products_shipping_class ON lats_products(shipping_class);
CREATE INDEX IF NOT EXISTS idx_lats_products_base_currency ON lats_products(base_currency);

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_rating ON lats_suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_lead_time ON lats_suppliers(lead_time);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_total_orders ON lats_suppliers(total_orders);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Product shipping fields
COMMENT ON COLUMN lats_products.weight IS 'Product weight in kg';
COMMENT ON COLUMN lats_products.length IS 'Product length in cm';
COMMENT ON COLUMN lats_products.width IS 'Product width in cm';
COMMENT ON COLUMN lats_products.height IS 'Product height in cm';
COMMENT ON COLUMN lats_products.cbm IS 'Cubic meters for sea shipping calculations';
COMMENT ON COLUMN lats_products.shipping_class IS 'Shipping classification: standard, fragile, hazardous, oversized';
COMMENT ON COLUMN lats_products.requires_special_handling IS 'Whether product requires special handling during shipping';

-- Product multi-currency fields
COMMENT ON COLUMN lats_products.usd_price IS 'Product price in USD';
COMMENT ON COLUMN lats_products.eur_price IS 'Product price in EUR';
COMMENT ON COLUMN lats_products.exchange_rate IS 'Exchange rate from base currency to display currency';
COMMENT ON COLUMN lats_products.base_currency IS 'Base currency for the product (typically TZS)';

-- Product purchase order fields
COMMENT ON COLUMN lats_products.last_order_date IS 'Date when this product was last ordered';
COMMENT ON COLUMN lats_products.last_order_quantity IS 'Quantity from the last order';
COMMENT ON COLUMN lats_products.pending_quantity IS 'Quantity currently pending in purchase orders';
COMMENT ON COLUMN lats_products.order_status IS 'Current status of any active purchase orders for this product';

-- Product shipping status fields
COMMENT ON COLUMN lats_products.shipping_status IS 'Current shipping status if product is in transit';
COMMENT ON COLUMN lats_products.tracking_number IS 'Tracking number for current shipment';
COMMENT ON COLUMN lats_products.expected_delivery IS 'Expected delivery date for current shipment';
COMMENT ON COLUMN lats_products.shipping_agent IS 'Name of shipping agent handling current shipment';
COMMENT ON COLUMN lats_products.shipping_carrier IS 'Name of shipping carrier for current shipment';

-- Product storage fields
COMMENT ON COLUMN lats_products.storage_room_name IS 'Name of storage room where product is located';
COMMENT ON COLUMN lats_products.shelf_name IS 'Name of shelf where product is located';
COMMENT ON COLUMN lats_products.store_location_name IS 'Name of store location where product is located';
COMMENT ON COLUMN lats_products.is_refrigerated IS 'Whether product requires refrigerated storage';
COMMENT ON COLUMN lats_products.requires_ladder IS 'Whether product requires ladder access';

-- Supplier performance fields
COMMENT ON COLUMN lats_suppliers.lead_time IS 'Average lead time in days for this supplier';
COMMENT ON COLUMN lats_suppliers.rating IS 'Overall supplier rating (0-5)';
COMMENT ON COLUMN lats_suppliers.total_orders IS 'Total number of orders placed with this supplier';
COMMENT ON COLUMN lats_suppliers.on_time_delivery_rate IS 'Percentage of on-time deliveries';
COMMENT ON COLUMN lats_suppliers.quality_rating IS 'Quality rating for supplier products (0-5)';

-- =====================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Update existing products with default values
UPDATE lats_products 
SET 
  shipping_class = 'standard',
  requires_special_handling = false,
  base_currency = 'TZS',
  exchange_rate = 1.0,
  last_order_quantity = 0,
  pending_quantity = 0,
  is_refrigerated = false,
  requires_ladder = false
WHERE shipping_class IS NULL 
   OR requires_special_handling IS NULL 
   OR base_currency IS NULL 
   OR exchange_rate IS NULL 
   OR last_order_quantity IS NULL 
   OR pending_quantity IS NULL 
   OR is_refrigerated IS NULL 
   OR requires_ladder IS NULL;

-- Update existing suppliers with default values
UPDATE lats_suppliers 
SET 
  lead_time = 7,
  rating = 0,
  total_orders = 0,
  on_time_delivery_rate = 0,
  quality_rating = 0
WHERE lead_time IS NULL 
   OR rating IS NULL 
   OR total_orders IS NULL 
   OR on_time_delivery_rate IS NULL 
   OR quality_rating IS NULL;
