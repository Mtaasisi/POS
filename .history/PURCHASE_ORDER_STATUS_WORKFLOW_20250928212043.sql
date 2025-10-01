-- =====================================================
-- PURCHASE ORDER STATUS WORKFLOW
-- =====================================================
-- This shows the complete PO status workflow

-- Step 1: Show the complete PO status workflow
SELECT 
    'PURCHASE ORDER STATUS WORKFLOW:' as message,
    '1. draft -> 2. sent -> 3. received -> 4. completed' as workflow;

-- Step 2: Check your current PO status
SELECT 
    'Current PO Status:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    total_amount,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 3: Show the complete status progression
SELECT 
    'COMPLETE STATUS PROGRESSION:' as message,
    'draft' as step_1,
    'sent' as step_2,
    'received' as step_3,
    'completed' as step_4;

-- Step 4: Update your PO to completed status (if it's currently received)
UPDATE lats_purchase_orders 
SET 
    status = 'completed',
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4'
AND status = 'received';

-- Step 5: Verify the status update
SELECT 
    'PO Status After Update:' as message,
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 6: Show the complete workflow explanation
SELECT 
    'WORKFLOW EXPLANATION:' as message,
    'draft = PO created but not sent to supplier' as draft_explanation,
    'sent = PO sent to supplier for fulfillment' as sent_explanation,
    'received = Items received from supplier' as received_explanation,
    'completed = All items received and processed' as completed_explanation;

-- Step 7: Success message
SELECT 
    'SUCCESS: PO status workflow explained!' as message,
    'After received, the next status is completed' as next_status,
    'This indicates the PO is fully processed' as completion_meaning;
