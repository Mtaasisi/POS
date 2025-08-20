-- Migration: Add attributes field to lats_products table
-- This migration adds the missing attributes field for product-level specifications

-- Add attributes field to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_attributes ON lats_products USING gin(attributes);

-- Update existing products to have default empty attributes
UPDATE lats_products 
SET attributes = '{}'
WHERE attributes IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN lats_products.attributes IS 'Product-level specifications and attributes stored as JSONB';
