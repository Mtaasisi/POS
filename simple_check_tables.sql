-- Simple table check - run this in your Supabase SQL editor

-- Check all payment-related tables
SELECT 'payment_methods' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'payment_method_accounts' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_method_accounts') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'payment_methods_accounts' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods_accounts') 
    THEN 'EXISTS (OLD NAME)' ELSE 'DOES NOT EXIST (CORRECT)' END as status;

-- Check finance tables
SELECT 'finance_accounts' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_accounts') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'finance_expenses' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_expenses') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check POS tables
SELECT 'sales_orders' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'installment_payments' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'installment_payments') 
    THEN 'EXISTS' ELSE 'MISSING' END as status;

-- List all tables that start with 'payment'
SELECT 'ALL PAYMENT TABLES:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'payment%' 
ORDER BY table_name; 