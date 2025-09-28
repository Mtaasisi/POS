-- Migration: Fix lats_product_variants table column name mismatch
-- This migration renames the 'price' column to 'selling_price' to match the codebase expectations
-- Migration: 20250131000041_fix_product_variants_price_column.sql

-- Check if the 'price' column exists and rename it to 'selling_price'
DO $$
BEGIN
    -- Check if the 'price' column exists in lats_product_variants table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_product_variants' 
        AND column_name = 'price'
        AND table_schema = 'public'
    ) THEN
        -- Rename the 'price' column to 'selling_price'
        ALTER TABLE lats_product_variants 
        RENAME COLUMN price TO selling_price;
        
        -- Add a comment to document the change
        COMMENT ON COLUMN lats_product_variants.selling_price IS 'Selling price of the product variant (renamed from price column)';
        
        RAISE NOTICE 'Successfully renamed price column to selling_price in lats_product_variants table';
    ELSE
        RAISE NOTICE 'Price column does not exist in lats_product_variants table, no changes needed';
    END IF;
    
    -- Also check if we need to add any missing columns that the codebase expects
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_product_variants' 
        AND column_name = 'min_quantity'
        AND table_schema = 'public'
    ) THEN
        -- Add min_quantity column if it doesn't exist
        ALTER TABLE lats_product_variants 
        ADD COLUMN min_quantity INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added min_quantity column to lats_product_variants table';
    END IF;
    
    -- Check if barcode column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_product_variants' 
        AND column_name = 'barcode'
        AND table_schema = 'public'
    ) THEN
        -- Add barcode column if it doesn't exist
        ALTER TABLE lats_product_variants 
        ADD COLUMN barcode TEXT;
        
        RAISE NOTICE 'Added barcode column to lats_product_variants table';
    END IF;
    
    -- Check if weight column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_product_variants' 
        AND column_name = 'weight'
        AND table_schema = 'public'
    ) THEN
        -- Add weight column if it doesn't exist
        ALTER TABLE lats_product_variants 
        ADD COLUMN weight DECIMAL(8,2);
        
        RAISE NOTICE 'Added weight column to lats_product_variants table';
    END IF;
    
    -- Check if dimensions column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_product_variants' 
        AND column_name = 'dimensions'
        AND table_schema = 'public'
    ) THEN
        -- Add dimensions column if it doesn't exist
        ALTER TABLE lats_product_variants 
        ADD COLUMN dimensions JSONB;
        
        RAISE NOTICE 'Added dimensions column to lats_product_variants table';
    END IF;
    
END $$;

-- Create or update the updated_at trigger for lats_product_variants
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_lats_product_variants_updated_at ON lats_product_variants;

-- Create the trigger
CREATE TRIGGER update_lats_product_variants_updated_at
    BEFORE UPDATE ON lats_product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for the migration
COMMENT ON TABLE lats_product_variants IS 'Product variants table with selling_price column (fixed from price column mismatch)';
