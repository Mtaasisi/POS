-- Test customer update to identify the issue
-- This will help us understand what's causing the 400 error

-- First, let's see what the current customer looks like
SELECT 'Current customer data:' as info;
SELECT * FROM customers WHERE id = 'c4aa2553-c004-464e-8b14-dea85379a89d';

-- Test updating with minimal data (like the frontend might send)
SELECT 'Testing minimal update...' as info;
UPDATE customers 
SET 
    name = 'Abdalah',
    updated_at = NOW()
WHERE id = 'c4aa2553-c004-464e-8b14-dea85379a89d'
RETURNING id, name, updated_at;

-- Test updating with more fields
SELECT 'Testing update with more fields...' as info;
UPDATE customers 
SET 
    name = 'Abdalah',
    email = 'abdalah@example.com',
    city = 'Dar es Salaam',
    color_tag = 'normal',
    loyalty_level = 'bronze',
    updated_at = NOW()
WHERE id = 'c4aa2553-c004-464e-8b14-dea85379a89d'
RETURNING id, name, email, city, color_tag, loyalty_level, updated_at;

-- Check if there are any triggers that might be causing issues
SELECT 'Checking for triggers...' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'customers';

-- Check if there are any foreign key constraints that might be violated
SELECT 'Checking foreign keys...' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'customers'; 