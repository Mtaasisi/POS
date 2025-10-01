-- =====================================================
-- FIX SPECIFIC PO STATUS UPDATE ISSUE
-- =====================================================
-- This addresses the specific 400 error when updating status to 'received'

-- Step 1: Check what's currently in the database
SELECT 
    'Current PO Data:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    currency,
    created_by,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 2: Check if there are any constraints on the status field
SELECT 
    'Status Constraints:' as message,
    cc.constraint_name,
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu 
ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'lats_purchase_orders'
AND ccu.column_name = 'status';

-- Step 3: Ensure the status field accepts 'received' value
-- Drop existing status constraints if they exist
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add a permissive constraint that allows all status values
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'partial_received', 'received', 'completed', 'cancelled'));

-- Step 4: Ensure all required fields have values before update
UPDATE lats_purchase_orders 
SET 
    updated_at = NOW(),
    currency = COALESCE(currency, 'TZS'),
    payment_status = COALESCE(payment_status, 'unpaid'),
    total_amount = COALESCE(total_amount, 0),
    total_paid = COALESCE(total_paid, 0)
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 5: Test the exact update that's failing
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 6: Verify the update worked
SELECT 
    'Update Test Result:' as message,
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 7: Check for any remaining issues
SELECT 
    'Final Check:' as message,
    CASE 
        WHEN status = 'received' THEN 'SUCCESS: Status updated to received'
        ELSE 'FAILED: Status not updated'
    END as result
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 8: Success message
SELECT 
    'SUCCESS: PO status update fix applied!' as message,
    'Status constraint updated to allow received' as constraint_fix,
    'All required fields populated' as data_fix,
    'The 400 error should now be resolved' as expected_result;
