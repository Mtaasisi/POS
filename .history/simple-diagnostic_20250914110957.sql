-- Simple diagnostic to check purchase order table
-- Run this in your Supabase SQL Editor

-- Check current status of the specific purchase order
SELECT id, status, created_at, updated_at 
FROM lats_purchase_orders 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';

-- Check what status values are allowed
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%' 
AND table_name = 'lats_purchase_orders';

-- Try a simple status update
UPDATE lats_purchase_orders 
SET status = 'partial_received' 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';

-- Check if the update worked
SELECT id, status, updated_at 
FROM lats_purchase_orders 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';
