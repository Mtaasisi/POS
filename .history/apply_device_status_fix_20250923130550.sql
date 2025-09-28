-- Apply device status constraint fix to allow repair-complete status
-- This fixes the 400 Bad Request error when updating device status

-- Drop any existing conflicting constraints
ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_status_transitions;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the comprehensive constraint with all required statuses including repair-complete
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

-- Verification query
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE table_name = 'devices' 
AND constraint_name = 'devices_status_check';
