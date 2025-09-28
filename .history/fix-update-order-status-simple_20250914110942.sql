-- Simple test to update order status without additional fields
-- This will help identify if the issue is with the timestamp or other fields

-- Test updating just the status field
UPDATE lats_purchase_orders 
SET status = 'partial_received' 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';

-- If that works, then the issue is with the updated_at field format
-- Let's also check what the current status is
SELECT id, status, updated_at 
FROM lats_purchase_orders 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6';
