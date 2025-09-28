-- =====================================================
-- DIAGNOSE CONSTRAINT ERROR
-- =====================================================

-- Check all constraints on the customers table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass;

-- Check the specific customer that's failing
SELECT 
    id,
    name,
    phone,
    gender,
    loyalty_level,
    color_tag,
    total_spent,
    points,
    created_at,
    updated_at
FROM customers 
WHERE phone = '255656007681';

-- Check if there are any other fields with constraints that might be causing issues
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try to identify which field has 'Basic' value
SELECT 
    'Checking for Basic value' as check_type,
    id,
    name,
    phone,
    gender,
    loyalty_level,
    color_tag,
    total_spent,
    points
FROM customers 
WHERE phone = '255656007681'
AND (
    gender = 'Basic' OR
    loyalty_level = 'Basic' OR
    color_tag = 'Basic' OR
    name = 'Basic'
);

-- Check if there are any other constraints we missed
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'customers'
AND tc.table_schema = 'public';
