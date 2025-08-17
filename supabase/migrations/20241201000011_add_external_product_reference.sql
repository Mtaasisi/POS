-- Migration: 20241201000011_add_external_product_reference.sql
-- Add external product reference to sale items table

-- Add external_product_id column to lats_sale_items table
ALTER TABLE lats_sale_items 
ADD COLUMN IF NOT EXISTS external_product_id UUID REFERENCES lats_external_products(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_external_product_id ON lats_sale_items(external_product_id);

-- Add comment to explain the column
COMMENT ON COLUMN lats_sale_items.external_product_id IS 'Reference to external product when this sale item is from an external product (not from main inventory)';
