-- Verify Unified Payment Methods Setup
-- Run this to check that everything is working correctly

-- 1. Check payment methods table
SELECT 'PAYMENT METHODS TABLE' as check_type;
SELECT COUNT(*) as total_payment_methods FROM payment_methods;
SELECT COUNT(*) as active_payment_methods FROM payment_methods WHERE is_active = true;

-- 2. Show all payment methods
SELECT 'ALL PAYMENT METHODS:' as info;
SELECT 
    name,
    code,
    type,
    icon,
    color,
    is_active
FROM payment_methods 
ORDER BY name;

-- 3. Check payment method accounts table
SELECT 'PAYMENT METHOD ACCOUNTS TABLE' as check_type;
SELECT COUNT(*) as total_account_links FROM payment_method_accounts;

-- 4. Check if payment_method_id columns were added
SELECT 'PAYMENT METHOD ID COLUMNS' as check_type;

-- Check sales_orders
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'payment_method_id'
    ) THEN '✅ payment_method_id added to sales_orders' 
    ELSE '❌ payment_method_id missing from sales_orders' END as sales_orders_check;

-- Check finance_expenses
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_expenses' AND column_name = 'payment_method_id'
    ) THEN '✅ payment_method_id added to finance_expenses' 
    ELSE '❌ payment_method_id missing from finance_expenses' END as finance_expenses_check;

-- Check installment_payments
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'installment_payments' AND column_name = 'payment_method_id'
    ) THEN '✅ payment_method_id added to installment_payments' 
    ELSE '❌ payment_method_id missing from installment_payments' END as installment_payments_check;

-- 5. Check functions
SELECT 'FUNCTIONS' as check_type;
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_payment_method_by_code') 
    THEN '✅ get_payment_method_by_code function exists' 
    ELSE '❌ get_payment_method_by_code function missing' END as function_check;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_active_payment_methods') 
    THEN '✅ get_active_payment_methods function exists' 
    ELSE '❌ get_active_payment_methods function missing' END as function_check;

-- 6. Check RLS policies
SELECT 'RLS POLICIES' as check_type;
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_methods' AND policyname = 'Users can view payment methods'
    ) THEN '✅ payment_methods RLS policy exists' 
    ELSE '❌ payment_methods RLS policy missing' END as policy_check;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_method_accounts' AND policyname = 'Users can view payment method accounts'
    ) THEN '✅ payment_method_accounts RLS policy exists' 
    ELSE '❌ payment_method_accounts RLS policy missing' END as policy_check;

-- 7. Test the functions
SELECT 'FUNCTION TESTS' as check_type;

-- Test get_payment_method_by_code
SELECT 'Testing get_payment_method_by_code for "cash":' as test;
SELECT get_payment_method_by_code('cash') as cash_method_id;

-- Test get_active_payment_methods
SELECT 'Testing get_active_payment_methods:' as test;
SELECT * FROM get_active_payment_methods() LIMIT 3;

-- 8. Summary
SELECT 'SETUP SUMMARY' as summary;
SELECT 
    'Unified Payment Methods Setup Complete!' as status,
    'You can now use PaymentMethodSelector components in your POS and Finance Management' as next_step; 