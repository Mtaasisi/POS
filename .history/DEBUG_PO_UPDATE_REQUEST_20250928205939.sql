-- =====================================================
-- DEBUG PURCHASE ORDER UPDATE REQUEST
-- =====================================================
-- This script helps identify what's causing the 400 error

-- Step 1: Check the current PO structure and data
SELECT 
    'STEP 1 - Current PO Data:' as message,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    currency,
    total_amount,
    created_by,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 2: Check table structure and constraints
SELECT 
    'STEP 2 - Table Structure:' as message,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_purchase_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check for any constraints that might be blocking updates
SELECT 
    'STEP 3 - Table Constraints:' as message,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'lats_purchase_orders';

-- Step 4: Check for check constraints specifically
SELECT 
    'STEP 4 - Check Constraints:' as message,
    cc.constraint_name,
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu 
ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'lats_purchase_orders';

-- Step 5: Test a simple update to see what fails
-- This will help identify the specific issue
UPDATE lats_purchase_orders 
SET 
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 6: Test status update specifically
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 7: Check if there are any triggers that might be causing issues
SELECT 
    'STEP 7 - Triggers:' as message,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'lats_purchase_orders';

-- Step 8: Final verification
SELECT 
    'STEP 8 - Final Status:' as message,
    id,
    order_number,
    status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';
