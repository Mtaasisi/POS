-- Add transaction confirmation fields to lats_sales table
-- Migration: 20250131000041_add_transaction_confirmation.sql

-- Add confirmation fields to lats_sales table
DO $$ 
BEGIN
    -- Add confirmed_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'confirmed_by'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN confirmed_by UUID REFERENCES auth_users(id);
    END IF;

    -- Add confirmed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update status constraint to include 'confirmed' status
ALTER TABLE lats_sales DROP CONSTRAINT IF EXISTS lats_sales_status_check;
ALTER TABLE lats_sales ADD CONSTRAINT lats_sales_status_check 
    CHECK (status IN ('pending', 'completed', 'confirmed', 'cancelled', 'refunded'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_confirmed_by ON lats_sales(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_lats_sales_confirmed_at ON lats_sales(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);

-- Add comments for documentation
COMMENT ON COLUMN lats_sales.confirmed_by IS 'User ID who confirmed the transaction';
COMMENT ON COLUMN lats_sales.confirmed_at IS 'Timestamp when the transaction was confirmed';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name IN (
    'confirmed_by', 
    'confirmed_at'
);
