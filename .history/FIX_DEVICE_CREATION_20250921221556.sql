-- Fix Device Creation Issues
-- Run this SQL directly in your database to add missing columns

-- Add missing columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS unlock_code TEXT DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_notes TEXT DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_cost NUMERIC(12,2) DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS device_condition TEXT DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_unlock_code ON devices(unlock_code);
CREATE INDEX IF NOT EXISTS idx_devices_device_cost ON devices(device_cost);
CREATE INDEX IF NOT EXISTS idx_devices_device_condition ON devices(device_condition);
CREATE INDEX IF NOT EXISTS idx_devices_repair_cost ON devices(repair_cost);
CREATE INDEX IF NOT EXISTS idx_devices_deposit_amount ON devices(deposit_amount);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND column_name IN ('unlock_code', 'device_notes', 'device_cost', 'device_condition', 'repair_cost', 'deposit_amount')
ORDER BY column_name;
