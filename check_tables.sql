-- Check what tables exist in the database
-- Run this in your Supabase SQL editor

-- Check if payment_methods table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') 
        THEN '✅ payment_methods table EXISTS'
        ELSE '❌ payment_methods table does NOT exist'
    END as payment_methods_status;

-- Check if payment_method_accounts table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_method_accounts') 
        THEN '✅ payment_method_accounts table EXISTS'
        ELSE '❌ payment_method_accounts table does NOT exist'
    END as payment_method_accounts_status;

-- Check if payment_methods_accounts table exists (old name)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods_accounts') 
        THEN '⚠️  payment_methods_accounts table EXISTS (old name)'
        ELSE '✅ payment_methods_accounts table does NOT exist (correct)'
    END as payment_methods_accounts_status;

-- List all tables that start with 'payment'
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'payment%' 
ORDER BY table_name;

-- Check if finance_accounts table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_accounts') 
        THEN '✅ finance_accounts table EXISTS'
        ELSE '❌ finance_accounts table does NOT exist'
    END as finance_accounts_status;

-- Check if sales_orders table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') 
        THEN '✅ sales_orders table EXISTS'
        ELSE '❌ sales_orders table does NOT exist'
    END as sales_orders_status;

-- Check if finance_expenses table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_expenses') 
        THEN '✅ finance_expenses table EXISTS'
        ELSE '❌ finance_expenses table does NOT exist'
    END as finance_expenses_status;

-- Check if installment_payments table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'installment_payments') 
        THEN '✅ installment_payments table EXISTS'
        ELSE '❌ installment_payments table does NOT exist'
    END as installment_payments_status; 