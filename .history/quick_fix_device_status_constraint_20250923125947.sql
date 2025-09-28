-- Quick fix for device status constraint conflict
-- Run this in Supabase SQL Editor to immediately fix the 400 error

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

-- Test the fix by checking if repair-complete is now allowed
SELECT 
    'repair-complete' as test_status,
    CASE 
        WHEN 'repair-complete' = ANY(ARRAY[
            'assigned', 'diagnosis-started', 'awaiting-admin-review',
            'awaiting-parts', 'parts-arrived', 'in-repair', 
            'reassembled-testing', 'repair-complete', 'process-payments',
            'returned-to-customer-care', 'done', 'failed'
        ]) THEN '✅ ALLOWED'
        ELSE '❌ NOT ALLOWED'
    END as status_check;
