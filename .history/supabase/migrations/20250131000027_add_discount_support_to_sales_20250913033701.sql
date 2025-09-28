-- Add discount support to lats_sales table
-- Migration: 20250131000027_add_discount_support_to_sales.sql

-- Add discount fields to lats_sales table if they don't exist
DO $$ 
BEGIN
    -- Add discount_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add discount_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage'));
    END IF;

    -- Add discount_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_value'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add subtotal column if it doesn't exist (for better calculation tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create index for discount queries
CREATE INDEX IF NOT EXISTS idx_lats_sales_discount_amount ON lats_sales(discount_amount);

-- Add comment to document the discount fields
COMMENT ON COLUMN lats_sales.discount_amount IS 'The actual discount amount applied to the sale';
COMMENT ON COLUMN lats_sales.discount_type IS 'Type of discount: fixed (amount) or percentage';
COMMENT ON COLUMN lats_sales.discount_value IS 'The original discount value (amount or percentage)';
COMMENT ON COLUMN lats_sales.subtotal IS 'Subtotal before discount and tax';
