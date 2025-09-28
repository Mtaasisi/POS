-- Add missing fields to devices table that are referenced in the application code
-- Migration: 20250131000056_add_missing_device_fields.sql

-- Add missing columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS diagnostic_checklist JSONB DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_checklist JSONB DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_repair_cost ON devices(repair_cost);
CREATE INDEX IF NOT EXISTS idx_devices_deposit_amount ON devices(deposit_amount);

-- Add comments for documentation
COMMENT ON COLUMN devices.repair_cost IS 'The repair cost amount from the form';
COMMENT ON COLUMN devices.deposit_amount IS 'The deposit amount from the form';
COMMENT ON COLUMN devices.diagnostic_checklist IS 'JSON data for diagnostic checklist progress';
COMMENT ON COLUMN devices.repair_checklist IS 'JSON data for repair checklist progress';

-- Verification
DO $$
DECLARE
    repair_cost_exists BOOLEAN;
    deposit_amount_exists BOOLEAN;
    diagnostic_checklist_exists BOOLEAN;
    repair_checklist_exists BOOLEAN;
BEGIN
    -- Check if repair_cost column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'repair_cost'
    ) INTO repair_cost_exists;
    
    -- Check if deposit_amount column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'deposit_amount'
    ) INTO deposit_amount_exists;
    
    -- Check if diagnostic_checklist column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'diagnostic_checklist'
    ) INTO diagnostic_checklist_exists;
    
    -- Check if repair_checklist column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'repair_checklist'
    ) INTO repair_checklist_exists;
    
    -- Report results
    IF repair_cost_exists THEN
        RAISE NOTICE '✅ repair_cost column exists';
    ELSE
        RAISE NOTICE '❌ repair_cost column missing';
    END IF;
    
    IF deposit_amount_exists THEN
        RAISE NOTICE '✅ deposit_amount column exists';
    ELSE
        RAISE NOTICE '❌ deposit_amount column missing';
    END IF;
    
    IF diagnostic_checklist_exists THEN
        RAISE NOTICE '✅ diagnostic_checklist column exists';
    ELSE
        RAISE NOTICE '❌ diagnostic_checklist column missing';
    END IF;
    
    IF repair_checklist_exists THEN
        RAISE NOTICE '✅ repair_checklist column exists';
    ELSE
        RAISE NOTICE '❌ repair_checklist column missing';
    END IF;
    
    RAISE NOTICE '✅ All missing device fields should now be available!';
END $$;
