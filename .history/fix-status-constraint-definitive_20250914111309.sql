-- Fix the status constraint definitively
-- Run this in your Supabase SQL Editor

-- First, let's see what the current constraint looks like
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'lats_purchase_orders_status_check';

-- Drop the existing constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add the new constraint with all required status values
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft', 
    'sent', 
    'confirmed', 
    'shipped', 
    'partial_received', 
    'received', 
    'cancelled'
));

-- Verify the constraint was added
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'lats_purchase_orders_status_check';

-- Test the update again
UPDATE lats_purchase_orders 
SET status = 'partial_received' 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';

-- Check if it worked
SELECT id, status FROM lats_purchase_orders WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';
