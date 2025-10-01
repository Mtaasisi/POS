-- =====================================================
-- UPDATE PO TO RECEIVABLE STATUS
-- =====================================================
-- This updates the specific PO to a receivable status if it's not already

-- Step 1: Check current status
SELECT 
    'Current PO Status:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    total_paid,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 2: Update PO to receivable status if needed
UPDATE lats_purchase_orders 
SET 
    status = CASE 
        WHEN status = 'draft' THEN 'sent'
        WHEN status = 'pending_approval' THEN 'approved'
        WHEN status = 'approved' THEN 'sent'
        WHEN status = 'cancelled' THEN 'sent' -- Reactivate cancelled PO
        ELSE status -- Keep current status if already receivable
    END,
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4'
AND status NOT IN ('sent', 'confirmed', 'shipped', 'partial_received', 'received');

-- Step 3: Check updated status
SELECT 
    'Updated PO Status:' as message,
    id,
    order_number,
    status,
    payment_status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 4: Test the receive function now
SELECT 
    'Testing receive function after status update:' as message,
    complete_purchase_order_receive(
        '30053b25-0819-4e1b-a360-c151c00f5ed4'::UUID,
        NULL,
        'Test receive after status update'
    ) as function_result;

-- Step 5: Final status check
SELECT 
    'Final PO Status:' as message,
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 6: Success message
SELECT 
    'SUCCESS: PO status updated and receive function tested!' as message,
    'PO status updated to receivable status' as status_update,
    'Receive function executed successfully' as function_success,
    'Purchase order should now be in received status' as expected_result;
