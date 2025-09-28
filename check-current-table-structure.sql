-- Check Current lats_sales Table Structure
-- Run this to see exactly what columns exist in your database

SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Also check constraints
SELECT 
    'Table constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lats_sales'
ORDER BY tc.constraint_type, tc.constraint_name;
