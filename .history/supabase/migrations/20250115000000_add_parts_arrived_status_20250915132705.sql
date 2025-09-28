-- Add 'parts-arrived' status to device status constraint
-- Migration: 20250115000000_add_parts_arrived_status.sql

-- Drop the existing status constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the updated constraint with 'parts-arrived' status
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

-- Add comment for documentation
COMMENT ON COLUMN devices.status IS 'Device status: assigned, diagnosis-started, awaiting-admin-review, awaiting-parts, parts-arrived, in-repair, reassembled-testing, repair-complete, process-payments, returned-to-customer-care, done, failed';

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
        RAISE NOTICE '✅ parts-arrived status is now allowed!';
        RAISE NOTICE '✅ process-payments status is now allowed!';
    ELSE
        RAISE NOTICE '❌ Failed to update device status constraint';
    END IF;
END $$;
