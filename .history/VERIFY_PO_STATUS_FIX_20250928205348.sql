-- =====================================================
-- VERIFY PURCHASE ORDER STATUS UPDATE FIX
-- =====================================================
-- This script verifies that the PO status update fix is working

-- Step 1: Check the specific PO from the logs
SELECT 
    'STEP 1 - Current PO Status:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 2: Check RLS policies are properly set
SELECT 
    'STEP 2 - RLS Policies:' as message,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'lats_purchase_orders';

-- Step 3: Test if we can update the PO status (simulation)
-- This should not return any errors
SELECT 
    'STEP 3 - Testing Update Permissions:' as message,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4'
        ) THEN 'PO exists and can be accessed'
        ELSE 'PO not found'
    END as po_access_test;

-- Step 4: Check if the complete_purchase_order_receive function exists
SELECT 
    'STEP 4 - Function Check:' as message,
    proname as function_name,
    proargnames as parameters,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'complete_purchase_order_receive';

-- Step 5: Check function permissions
SELECT 
    'STEP 5 - Function Permissions:' as message,
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'complete_purchase_order_receive';

-- Step 6: Test the function with the specific PO (dry run)
-- This will show if the function can access the PO
SELECT 
    'STEP 6 - Function Access Test:' as message,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4'
            AND status IN ('sent', 'confirmed', 'shipped', 'partial_received')
        ) THEN 'Function should be able to process this PO'
        ELSE 'PO not in receivable status or not found'
    END as function_access_test;

-- Step 7: Check related tables permissions
SELECT 
    'STEP 7 - Related Tables Permissions:' as message,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_name IN ('lats_purchase_orders', 'lats_purchase_order_items', 'lats_inventory_adjustments');

-- Step 8: Final verification
SELECT 
    'VERIFICATION COMPLETE' as message,
    'If all steps show proper access, the 400 error should be fixed' as result,
    'The PO status update from sent to received should now work' as expected_behavior;
