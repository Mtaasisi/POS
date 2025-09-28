-- Fix device status constraint to include 'awaiting-admin-review'
-- Migration: 20250131000042_fix_device_status_constraint.sql

-- Drop the existing status constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the updated constraint with 'awaiting-admin-review' status
ALTER TABLE devices ADD CONSTRAINT devices_status_check 
CHECK (status IN (
    'assigned', 
    'diagnosis-started', 
    'awaiting-admin-review',
    'awaiting-parts', 
    'in-repair', 
    'reassembled-testing', 
    'repair-complete', 
    'returned-to-customer-care', 
    'done', 
    'failed'
));

-- Add comment for documentation
COMMENT ON COLUMN devices.status IS 'Device status: assigned, diagnosis-started, awaiting-admin-review, awaiting-parts, in-repair, reassembled-testing, repair-complete, returned-to-customer-care, done, failed';

-- Verification
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND constraint_name = 'devices_status_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '✅ Device status constraint updated successfully!';
        RAISE NOTICE '✅ awaiting-admin-review status is now allowed!';
        RAISE NOTICE '✅ Diagnostic checklist admin submission should work now!';
    ELSE
        RAISE NOTICE '❌ Failed to update device status constraint';
    END IF;
END $$;
