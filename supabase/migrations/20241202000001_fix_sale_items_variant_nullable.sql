-- Migration: Make variant_id nullable in lats_sale_items table
-- This fixes the 400 error when trying to insert sale items without variants

-- Drop the existing foreign key constraint
ALTER TABLE lats_sale_items 
DROP CONSTRAINT IF EXISTS lats_sale_items_variant_id_fkey;

-- Make variant_id nullable
ALTER TABLE lats_sale_items 
ALTER COLUMN variant_id DROP NOT NULL;

-- Re-add the foreign key constraint with CASCADE DELETE
ALTER TABLE lats_sale_items 
ADD CONSTRAINT lats_sale_items_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;

-- Add a comment to document the change
COMMENT ON COLUMN lats_sale_items.variant_id IS 'Nullable variant ID - null for single-variant products or when variant is not specified';
