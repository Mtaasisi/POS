-- Fix missing columns in devices table
-- This migration adds the repair_price column that the application expects

-- Add repair_price column if it doesn't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_price NUMERIC(12,2) DEFAULT 0;

-- Add repair_cost column if it doesn't exist (alternative naming)
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;

-- Add deposit_amount column if it doesn't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN devices.repair_price IS 'The repair price amount from the form';
COMMENT ON COLUMN devices.repair_cost IS 'The repair cost amount (alternative to repair_price)';
COMMENT ON COLUMN devices.deposit_amount IS 'The deposit amount from the form';

-- Verify the columns exist
DO $$
DECLARE
    repair_price_exists BOOLEAN;
    repair_cost_exists BOOLEAN;
    deposit_amount_exists BOOLEAN;
BEGIN
    -- Check if repair_price column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'repair_price'
    ) INTO repair_price_exists;
    
    -- Check if repair_cost column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'repair_cost'
    ) INTO repair_cost_exists;
    
    -- Check if deposit_amount column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'deposit_amount'
    ) INTO deposit_amount_exists;
    
    -- Log results
    RAISE NOTICE 'repair_price column exists: %', repair_price_exists;
    RAISE NOTICE 'repair_cost column exists: %', repair_cost_exists;
    RAISE NOTICE 'deposit_amount column exists: %', deposit_amount_exists;
END $$;
