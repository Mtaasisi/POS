-- Migration: Add fields to lats_product_validation table to store product updates made during validation
-- This allows the system to preserve cost prices, supplier info, and other updates when moving products to inventory

-- Add columns to store updated product information during validation
ALTER TABLE lats_product_validation 
ADD COLUMN IF NOT EXISTS updated_cost_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS updated_selling_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS updated_supplier_id UUID REFERENCES lats_suppliers(id),
ADD COLUMN IF NOT EXISTS updated_category_id UUID REFERENCES lats_categories(id),
ADD COLUMN IF NOT EXISTS updated_product_name TEXT,
ADD COLUMN IF NOT EXISTS updated_product_description TEXT,
ADD COLUMN IF NOT EXISTS updated_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN lats_product_validation.updated_cost_price IS 'Cost price set during product validation';
COMMENT ON COLUMN lats_product_validation.updated_selling_price IS 'Selling price set during product validation';
COMMENT ON COLUMN lats_product_validation.updated_supplier_id IS 'Supplier ID set during product validation';
COMMENT ON COLUMN lats_product_validation.updated_category_id IS 'Category ID set during product validation';
COMMENT ON COLUMN lats_product_validation.updated_product_name IS 'Product name updated during validation';
COMMENT ON COLUMN lats_product_validation.updated_product_description IS 'Product description updated during validation';
COMMENT ON COLUMN lats_product_validation.updated_notes IS 'Additional notes from validation process';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_validation_updated_supplier ON lats_product_validation(updated_supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_validation_updated_category ON lats_product_validation(updated_category_id);

-- Update the table comment
COMMENT ON TABLE lats_product_validation IS 'Tracks validation status of draft products and stores updates made during validation process including cost prices, supplier info, and product details';
