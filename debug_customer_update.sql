-- Debug customer update issues
-- This will help us understand what's causing the 400 error

-- STEP 1: Check the specific customer that's failing
SELECT 'Customer details:' as info;
SELECT 
    id,
    name,
    email,
    phone,
    gender,
    city,
    color_tag,
    loyalty_level,
    is_active,
    created_at,
    updated_at
FROM customers 
WHERE id = 'c4aa2553-c004-464e-8b14-dea85379a89d';

-- STEP 2: Check table structure
SELECT 'Table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- STEP 3: Check constraints
SELECT 'Table constraints:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass;

-- STEP 4: Check RLS policies
SELECT 'RLS policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customers';

-- STEP 5: Test a simple update
SELECT 'Testing simple update...' as info;
UPDATE customers 
SET updated_at = NOW() 
WHERE id = 'c4aa2553-c004-464e-8b14-dea85379a89d'
RETURNING id, name, updated_at; 