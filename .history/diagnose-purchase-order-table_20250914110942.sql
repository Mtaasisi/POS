-- Diagnose lats_purchase_orders table structure and constraints
-- Run this in your Supabase SQL Editor to see what's causing the 400 error

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lats_purchase_orders' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lats_purchase_orders'
ORDER BY tc.constraint_name;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'lats_purchase_orders';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'lats_purchase_orders';

-- Test a simple update to see what error we get
-- (This will help identify the exact issue)
SELECT 'Testing simple update...' as test_message;

-- Try to update just the status field
UPDATE lats_purchase_orders 
SET status = 'partial_received' 
WHERE id = '3c1681e3-0acb-4f19-9266-e544544a15b6' 
LIMIT 1;
