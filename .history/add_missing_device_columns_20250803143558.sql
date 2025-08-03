-- Add missing columns to devices table
-- This script adds the columns that are missing from your Supabase devices table

-- Add unlock_code column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS unlock_code TEXT;

-- Add repair_cost column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10,2);

-- Add deposit_amount column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

-- Add diagnosis_required column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS diagnosis_required BOOLEAN DEFAULT false;

-- Add device_notes column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_notes TEXT;

-- Add device_cost column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_cost DECIMAL(10,2);

-- Add estimated_hours column (this might already exist)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;

-- Add device_condition column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_condition JSONB;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'devices'
    AND column_name IN (
        'unlock_code',
        'repair_cost',
        'deposit_amount',
        'diagnosis_required',
        'device_notes',
        'device_cost',
        'estimated_hours',
        'device_condition'
    )
ORDER BY column_name; 