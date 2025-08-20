-- Migration: Fix product creation 400 error
-- This migration adds missing columns to lats_products table that are required by AddProductPage

-- Add missing columns to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_products_barcode ON lats_products(barcode);

-- Update existing products to have default values for new columns
UPDATE lats_products 
SET 
  stock_quantity = 0,
  min_stock_level = 0
WHERE stock_quantity IS NULL 
   OR min_stock_level IS NULL;

-- Add RLS policies for new columns if they don't exist
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lats_products;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lats_products;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lats_products;
  
  -- Create new policies that include all columns
  CREATE POLICY "Enable read access for all users" ON lats_products
    FOR SELECT USING (true);
    
  CREATE POLICY "Enable insert for authenticated users only" ON lats_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "Enable update for authenticated users only" ON lats_products
    FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Enable delete for authenticated users only" ON lats_products
    FOR DELETE USING (auth.role() = 'authenticated');
END $$;
