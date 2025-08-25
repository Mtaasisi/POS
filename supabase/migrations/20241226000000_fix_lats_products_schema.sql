-- Migration: Fix lats_products table schema
-- This migration adds missing columns that are being requested by the frontend

-- Add missing columns to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for new columns (removed problematic GIN index)
CREATE INDEX IF NOT EXISTS idx_lats_products_tags ON lats_products USING gin(tags);

-- Update existing products to have default values
UPDATE lats_products 
SET 
  internal_notes = COALESCE(internal_notes, ''),
  tags = COALESCE(tags, '{}')
WHERE internal_notes IS NULL 
   OR tags IS NULL;

-- Ensure all required columns exist with proper defaults
DO $$
BEGIN
    -- Add any other missing columns that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'condition') THEN
        ALTER TABLE lats_products ADD COLUMN condition TEXT DEFAULT 'new';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'store_shelf') THEN
        ALTER TABLE lats_products ADD COLUMN store_shelf TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'attributes') THEN
        ALTER TABLE lats_products ADD COLUMN attributes JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'images') THEN
        ALTER TABLE lats_products ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create indexes for all columns that might be queried
CREATE INDEX IF NOT EXISTS idx_lats_products_condition ON lats_products(condition);
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf ON lats_products(store_shelf);
CREATE INDEX IF NOT EXISTS idx_lats_products_attributes ON lats_products USING gin(attributes);
CREATE INDEX IF NOT EXISTS idx_lats_products_images ON lats_products USING gin(images);

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

-- Add comments to document the columns
COMMENT ON COLUMN lats_products.internal_notes IS 'Internal notes for staff use';
COMMENT ON COLUMN lats_products.tags IS 'Product tags for categorization';
COMMENT ON COLUMN lats_products.condition IS 'Product condition (new, used, refurbished)';
COMMENT ON COLUMN lats_products.store_shelf IS 'Physical location in store';
COMMENT ON COLUMN lats_products.attributes IS 'Product attributes and specifications';
COMMENT ON COLUMN lats_products.images IS 'Array of product image URLs';
