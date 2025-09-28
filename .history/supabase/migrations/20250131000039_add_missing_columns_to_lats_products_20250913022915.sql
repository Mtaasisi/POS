-- Add missing columns to existing lats_products table
-- Migration: 20250131000039_add_missing_columns_to_lats_products.sql

-- Add missing columns to lats_products table if they don't exist
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_lats_products_brand_id ON lats_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_supplier_id ON lats_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_products_barcode ON lats_products(barcode);

-- Add unique constraint for sku if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_products_sku_key' 
        AND table_name = 'lats_products'
    ) THEN
        ALTER TABLE lats_products ADD CONSTRAINT lats_products_sku_key UNIQUE (sku);
    END IF;
END $$;
