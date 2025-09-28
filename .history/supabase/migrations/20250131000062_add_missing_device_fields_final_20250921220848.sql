-- Add missing device fields that are referenced in application code
-- Migration: 20250131000062_add_missing_device_fields_final.sql

-- Add missing columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS unlock_code TEXT DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_notes TEXT DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_cost NUMERIC(12,2) DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_condition TEXT DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_unlock_code ON devices(unlock_code);
CREATE INDEX IF NOT EXISTS idx_devices_device_cost ON devices(device_cost);
CREATE INDEX IF NOT EXISTS idx_devices_device_condition ON devices(device_condition);

-- Add comments for documentation
COMMENT ON COLUMN devices.unlock_code IS 'Device unlock code or passcode';
COMMENT ON COLUMN devices.device_notes IS 'Additional notes about the device';
COMMENT ON COLUMN devices.device_cost IS 'Cost of the device itself';
COMMENT ON COLUMN devices.device_condition IS 'Physical condition assessment of the device';

-- Verification
DO $$
DECLARE
    unlock_code_exists BOOLEAN;
    device_notes_exists BOOLEAN;
    device_cost_exists BOOLEAN;
    device_condition_exists BOOLEAN;
BEGIN
    -- Check if unlock_code column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'unlock_code'
    ) INTO unlock_code_exists;
    
    -- Check if device_notes column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'device_notes'
    ) INTO device_notes_exists;
    
    -- Check if device_cost column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'device_cost'
    ) INTO device_cost_exists;
    
    -- Check if device_condition column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'device_condition'
    ) INTO device_condition_exists;
    
    -- Report results
    IF unlock_code_exists THEN
        RAISE NOTICE '✅ unlock_code column exists';
    ELSE
        RAISE NOTICE '❌ unlock_code column missing';
    END IF;
    
    IF device_notes_exists THEN
        RAISE NOTICE '✅ device_notes column exists';
    ELSE
        RAISE NOTICE '❌ device_notes column missing';
    END IF;
    
    IF device_cost_exists THEN
        RAISE NOTICE '✅ device_cost column exists';
    ELSE
        RAISE NOTICE '❌ device_cost column missing';
    END IF;
    
    IF device_condition_exists THEN
        RAISE NOTICE '✅ device_condition column exists';
    ELSE
        RAISE NOTICE '❌ device_condition column missing';
    END IF;
    
    RAISE NOTICE '✅ All missing device fields have been added successfully!';
END $$;
