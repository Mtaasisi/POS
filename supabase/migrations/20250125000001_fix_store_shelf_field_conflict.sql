-- Migration: 20250125000001_fix_store_shelf_field_conflict.sql
-- Purpose: Fix the store shelf field conflict by ensuring only store_shelf_id exists

-- First, check if the old store_shelf field exists and remove it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'store_shelf') THEN
        ALTER TABLE lats_products DROP COLUMN store_shelf;
        RAISE NOTICE 'Removed old store_shelf TEXT column from lats_products table';
    ELSE
        RAISE NOTICE 'Old store_shelf column does not exist in lats_products table';
    END IF;
END $$;

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_lats_products_store_shelf;

-- Ensure the correct store_shelf_id field exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'store_shelf_id') THEN
        ALTER TABLE lats_products ADD COLUMN store_shelf_id UUID REFERENCES lats_store_shelves(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added store_shelf_id UUID column to lats_products table';
    ELSE
        RAISE NOTICE 'store_shelf_id column already exists in lats_products table';
    END IF;
END $$;

-- Create the correct index for store_shelf_id
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf_id ON lats_products(store_shelf_id);

-- Ensure the lats_store_shelves table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_store_shelves') THEN
        RAISE EXCEPTION 'lats_store_shelves table does not exist. Please run the store shelves migration first.';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN lats_products.store_shelf_id IS 'Reference to the specific shelf where this product is stored';

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_products' 
AND column_name LIKE '%shelf%'
ORDER BY column_name;
