-- Check if payment method columns exist in finance_accounts table
-- Run this in your Supabase SQL Editor to diagnose the 400 error

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'finance_accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_accounts' 
        AND column_name = 'is_payment_method'
    ) THEN '✅ is_payment_method exists' ELSE '❌ is_payment_method missing' END as status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_accounts' 
        AND column_name = 'payment_icon'
    ) THEN '✅ payment_icon exists' ELSE '❌ payment_icon missing' END as status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_accounts' 
        AND column_name = 'payment_color'
    ) THEN '✅ payment_color exists' ELSE '❌ payment_color missing' END as status;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finance_accounts' 
        AND column_name = 'payment_description'
    ) THEN '✅ payment_description exists' ELSE '❌ payment_description missing' END as status;

-- Check sample data
SELECT 
    id,
    name,
    type,
    is_payment_method,
    payment_icon,
    payment_color,
    payment_description
FROM finance_accounts 
LIMIT 5; 