-- Fix product_images foreign key relationship
-- Migration: 20250131000050_fix_product_images_foreign_key.sql

-- Add foreign key constraint between product_images and lats_products
-- This will allow the join query images:product_images(*) to work

-- First, check if the constraint already exists and drop it if it does
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_product_images_product_id' 
        AND table_name = 'product_images'
    ) THEN
        ALTER TABLE product_images DROP CONSTRAINT fk_product_images_product_id;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE product_images 
ADD CONSTRAINT fk_product_images_product_id 
FOREIGN KEY (product_id) 
REFERENCES lats_products(id) 
ON DELETE CASCADE;

-- Create an index on product_id for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id_fk 
ON product_images(product_id);

-- Verify the constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_product_images_product_id' 
        AND table_name = 'product_images'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE 'Foreign key constraint created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create foreign key constraint';
    END IF;
END $$;
