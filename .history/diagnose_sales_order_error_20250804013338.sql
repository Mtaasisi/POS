-- Diagnostic script to check sales_orders table
-- Run this in your Supabase SQL Editor

-- 1. Check if sales_orders table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'sales_orders';

-- 2. Check sales_orders table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'sales_orders'
ORDER BY ordinal_position;

-- 3. Check if there are any constraints that might be causing issues
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'sales_orders';

-- 4. Check RLS policies
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
WHERE tablename = 'sales_orders';

-- 5. Test inserting a simple record
INSERT INTO sales_orders (
    customer_id,
    total_amount,
    final_amount,
    payment_method,
    created_by,
    customer_type
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    100.00,
    100.00,
    'card',
    '00000000-0000-0000-0000-000000000000',
    'retail'
) RETURNING id;

-- 6. Clean up test record
DELETE FROM sales_orders WHERE customer_id = '00000000-0000-0000-0000-000000000000';

-- 7. Check for any missing required fields
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_orders' 
AND is_nullable = 'NO' 
AND column_default IS NULL; 