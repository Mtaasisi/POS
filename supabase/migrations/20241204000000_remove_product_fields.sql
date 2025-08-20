-- Migration to remove product fields: weight, dimensions, tags, is_featured, is_digital, requires_shipping, tax_rate
-- This migration permanently removes these fields from the lats_products table

-- Remove columns from lats_products table
ALTER TABLE lats_products 
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS dimensions,
DROP COLUMN IF EXISTS tags,
DROP COLUMN IF EXISTS is_featured,
DROP COLUMN IF EXISTS is_digital,
DROP COLUMN IF EXISTS requires_shipping,
DROP COLUMN IF EXISTS tax_rate;

-- Remove columns from lats_product_variants table
ALTER TABLE lats_product_variants 
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS dimensions;

-- Drop indexes that are no longer needed
DROP INDEX IF EXISTS idx_lats_products_featured;
DROP INDEX IF EXISTS idx_lats_products_digital;

-- Update any existing RLS policies that might reference these columns
-- (This will be handled automatically by Supabase when columns are dropped)

-- Clean up any views or functions that might reference these columns
-- Note: You may need to recreate views/functions that reference these columns
