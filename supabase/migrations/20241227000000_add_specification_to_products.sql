-- Migration: Add specification column to lats_products table
-- This migration adds a dedicated specification field for product specifications

-- Add specification column to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS specification TEXT;

-- Update existing products to have default values
UPDATE lats_products 
SET specification = COALESCE(specification, '')
WHERE specification IS NULL;

-- Create index for specification column for better search performance
CREATE INDEX IF NOT EXISTS idx_lats_products_specification ON lats_products USING gin(to_tsvector('english', specification));

-- Add comment to document the column
COMMENT ON COLUMN lats_products.specification IS 'Product specifications and technical details';

-- Update RLS policies to ensure specification column is accessible
-- (The existing policies should already cover this, but let's make sure)
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
CREATE POLICY "Enable read access for all users" ON lats_products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_products;
CREATE POLICY "Enable insert for authenticated users" ON lats_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_products;
CREATE POLICY "Enable update for authenticated users" ON lats_products
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON lats_products;
CREATE POLICY "Enable delete for authenticated users" ON lats_products
    FOR DELETE USING (auth.role() = 'authenticated');
