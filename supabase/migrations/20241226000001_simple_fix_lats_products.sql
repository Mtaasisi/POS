-- Simple Migration: Fix lats_products table schema
-- This migration adds missing columns without problematic indexes

-- Add missing columns to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS store_shelf TEXT,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update existing products to have default values
UPDATE lats_products 
SET 
  internal_notes = COALESCE(internal_notes, ''),
  tags = COALESCE(tags, '{}'),
  condition = COALESCE(condition, 'new'),
  attributes = COALESCE(attributes, '{}'),
  images = COALESCE(images, '{}')
WHERE internal_notes IS NULL 
   OR tags IS NULL
   OR condition IS NULL
   OR attributes IS NULL
   OR images IS NULL;

-- Create simple indexes (avoiding GIN indexes that might be too large)
CREATE INDEX IF NOT EXISTS idx_lats_products_condition ON lats_products(condition);
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf ON lats_products(store_shelf);

-- Update RLS policies to ensure all columns are accessible
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
CREATE POLICY "Enable read access for all users" ON lats_products
    FOR SELECT USING (true);

-- Ensure the table has proper triggers for updated_at
CREATE OR REPLACE FUNCTION update_lats_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lats_products_updated_at ON lats_products;
CREATE TRIGGER update_lats_products_updated_at 
    BEFORE UPDATE ON lats_products 
    FOR EACH ROW EXECUTE FUNCTION update_lats_products_updated_at();
