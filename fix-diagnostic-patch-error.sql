-- Fix for PATCH request error on devices table
-- This script adds the missing diagnostic_checklist and repair_checklist columns
-- Run this in your Supabase SQL Editor

-- Add diagnostic_checklist column as JSONB to store diagnostic results
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS diagnostic_checklist JSONB DEFAULT NULL;

-- Add repair_checklist column as JSONB to store repair checklist data
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_checklist JSONB DEFAULT NULL;

-- Create indexes for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_devices_diagnostic_checklist ON devices USING GIN (diagnostic_checklist);
CREATE INDEX IF NOT EXISTS idx_devices_repair_checklist ON devices USING GIN (repair_checklist);

-- Add comments for documentation
COMMENT ON COLUMN devices.diagnostic_checklist IS 'Stores diagnostic checklist results including items, notes, summary, and overall status';
COMMENT ON COLUMN devices.repair_checklist IS 'Stores repair checklist progress including items, notes, and completion status';

-- Verification query to check if columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND table_schema = 'public' 
AND column_name IN ('diagnostic_checklist', 'repair_checklist')
ORDER BY column_name;
