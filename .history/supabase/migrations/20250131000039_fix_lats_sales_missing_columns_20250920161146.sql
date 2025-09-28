-- Fix missing customer_name and customer_phone columns in lats_sales table
-- Migration: 20250131000039_fix_lats_sales_missing_columns.sql

-- Add missing columns that are referenced in API calls but don't exist in the database
DO $$ 
BEGIN
    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_name VARCHAR(255);
    END IF;

    -- Add customer_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_phone VARCHAR(20);
    END IF;

    -- Add tax column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'tax'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add discount column if it doesn't exist (different from discount_amount)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_name ON lats_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_phone ON lats_sales(customer_phone);

-- Add comments for documentation
COMMENT ON COLUMN lats_sales.customer_name IS 'Customer name for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.customer_phone IS 'Customer phone for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.tax IS 'Tax amount applied to the sale';
COMMENT ON COLUMN lats_sales.discount IS 'Discount amount applied to the sale (alias for discount_amount)';

-- Update existing records to populate customer_name and customer_phone from customers table
UPDATE lats_sales 
SET 
    customer_name = c.name,
    customer_phone = c.phone
FROM customers c
WHERE lats_sales.customer_id = c.id 
  AND (lats_sales.customer_name IS NULL OR lats_sales.customer_phone IS NULL);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name IN (
    'customer_name', 
    'customer_phone', 
    'tax', 
    'discount'
);
