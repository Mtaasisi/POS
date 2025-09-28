-- Apply the parts-arrived status migration manually
-- Run this SQL directly in your Supabase dashboard or database client

-- Drop the existing status constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the updated constraint with 'parts-arrived' and 'process-payments' status
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

-- Verification query
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE table_name = 'devices' 
AND constraint_name = 'devices_status_check';
