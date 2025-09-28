-- Simple migration to add new device statuses
-- Run this in your Supabase SQL editor

-- Step 1: Drop the existing constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Step 2: Add the new constraint with all statuses
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

-- Step 3: Verify the constraint was added
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'devices' 
AND constraint_type = 'CHECK';
