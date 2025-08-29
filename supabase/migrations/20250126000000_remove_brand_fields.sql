-- Migration: Remove brand fields and table
-- This migration removes all brand-related fields and the brands table

-- Remove foreign key constraint and brand_id column from lats_products
ALTER TABLE lats_products 
DROP CONSTRAINT IF EXISTS lats_products_brand_id_fkey,
DROP COLUMN IF EXISTS brand_id;

-- Drop the brands table entirely since it's no longer needed
DROP TABLE IF EXISTS lats_brands CASCADE;

-- Update any indexes that might reference brand_id
DROP INDEX IF EXISTS idx_lats_products_brand_id;

-- Remove brand references from existing data
-- (No data cleanup needed since we're dropping the column)

-- Add comment for documentation
COMMENT ON TABLE lats_products IS 'LATS Products table - brand field removed as per user request';