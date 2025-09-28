-- Check Current customers Table Structure
-- Run this to see exactly what columns exist in your customers table

SELECT 
    'Current customers columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Also check constraints
SELECT 
    'Table constraints:' as info,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE table_name = 'customers'
ORDER BY constraint_type, constraint_name;
