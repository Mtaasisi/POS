-- =====================================================
-- QUICK DATABASE CHECK
-- =====================================================
-- Run this to verify the database changes were applied

-- Check if all required columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
ORDER BY ordinal_position;

-- Check if constraints exist
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name LIKE 'check_customer_payments_%';

-- Check if RLS policies exist
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'customer_payments';

-- Check permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
AND grantee = 'authenticated';
