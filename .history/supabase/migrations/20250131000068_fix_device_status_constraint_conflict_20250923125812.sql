-- Fix device status constraint conflicts
-- This migration resolves the conflict between devices_status_check and check_status_transitions constraints
-- Migration: 20250131000068_fix_device_status_constraint_conflict.sql

-- Drop the conflicting constraint that was added in fix_payment_workflow.sql
ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_status_transitions;

-- Ensure the primary devices_status_check constraint includes all required statuses
-- Drop and recreate to ensure it's up to date
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the comprehensive constraint with all required statuses
ALTER TABLE devices ADD CONSTRAINT devices_status_check 
CHECK (status IN (
    'assigned', 
    'diagnosis-started', 
    'awaiting-admin-review',
    'awaiting-parts', 
    'parts-arrived',
    'in-repair', 
    'reassembled-testing', 
    'repair-complete', 
    'process-payments',
    'returned-to-customer-care', 
    'done', 
    'failed'
));

-- Update the comment to reflect all statuses
COMMENT ON COLUMN devices.status IS 'Device status: assigned, diagnosis-started, awaiting-admin-review, awaiting-parts, parts-arrived, in-repair, reassembled-testing, repair-complete, process-payments, returned-to-customer-care, done, failed';

-- Verification
DO $$
DECLARE
    constraint_exists BOOLEAN;
    constraint_count INTEGER;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND constraint_name = 'devices_status_check'
    ) INTO constraint_exists;
    
    -- Count total constraints on devices table
    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'devices'
    AND constraint_type = 'CHECK';
    
    IF constraint_exists THEN
        RAISE NOTICE '✅ Device status constraint updated successfully!';
        RAISE NOTICE '✅ All required statuses are now allowed!';
        RAISE NOTICE '✅ Total CHECK constraints on devices table: %', constraint_count;
        RAISE NOTICE '✅ repair-complete status should now work properly!';
    ELSE
        RAISE NOTICE '❌ Failed to update device status constraint';
    END IF;
END $$;
