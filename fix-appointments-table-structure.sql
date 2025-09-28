-- Fix appointments table structure to match application code
-- This SQL fixes the field name mismatches causing 400 errors

-- Add missing columns to match application expectations
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Update existing data to populate new fields from existing fields
UPDATE appointments 
SET 
  service_type = appointment_type,
  appointment_date = scheduled_date::DATE,
  appointment_time = '09:00:00'::TIME, -- Default time since we don't have it
  duration_minutes = estimated_duration
WHERE service_type IS NULL;

-- Make the new fields NOT NULL after populating them
ALTER TABLE appointments 
ALTER COLUMN service_type SET NOT NULL,
ALTER COLUMN appointment_date SET NOT NULL,
ALTER COLUMN appointment_time SET NOT NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_time ON appointments(appointment_time);

-- Update the status constraint to match application expectations
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show'));

-- Update default status to match application expectations
ALTER TABLE appointments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Verify the changes
SELECT 'Appointments table structure fixed successfully' as status;
