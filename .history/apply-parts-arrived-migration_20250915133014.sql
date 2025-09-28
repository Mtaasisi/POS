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
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'devices' 
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name = 'devices_status_check';
