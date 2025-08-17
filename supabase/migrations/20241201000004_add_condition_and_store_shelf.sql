-- Add condition and store_shelf fields to lats_products table
-- Migration: 20241201000004_add_condition_and_store_shelf.sql

-- Add condition field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'condition') THEN
        ALTER TABLE lats_products ADD COLUMN condition TEXT DEFAULT 'new';
        RAISE NOTICE 'Added condition column to lats_products table';
    ELSE
        RAISE NOTICE 'condition column already exists in lats_products table';
    END IF;
END $$;

-- Add store_shelf field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'store_shelf') THEN
        ALTER TABLE lats_products ADD COLUMN store_shelf TEXT;
        RAISE NOTICE 'Added store_shelf column to lats_products table';
    ELSE
        RAISE NOTICE 'store_shelf column already exists in lats_products table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_condition ON lats_products(condition);
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf ON lats_products(store_shelf);

-- Update existing records with default values
UPDATE lats_products SET 
    condition = COALESCE(condition, 'new')
WHERE condition IS NULL;
