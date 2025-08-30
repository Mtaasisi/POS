-- Migration: Remove barcode columns from LATS tables
-- This migration removes barcode fields from lats_products and lats_product_variants tables
-- since barcode functionality has been removed from the application

-- Drop indexes on barcode columns first
DROP INDEX IF EXISTS idx_lats_products_barcode;
DROP INDEX IF EXISTS idx_lats_product_variants_barcode;

-- Remove barcode column from lats_products table
ALTER TABLE lats_products 
DROP COLUMN IF EXISTS barcode;

-- Remove barcode column from lats_product_variants table  
ALTER TABLE lats_product_variants 
DROP COLUMN IF EXISTS barcode;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Removed barcode columns from lats_products and lats_product_variants tables';
END $$;
