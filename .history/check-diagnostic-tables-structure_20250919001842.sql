-- Check the structure of diagnostic tables to understand column types

-- Check diagnostic_devices table structure
SELECT 
    'diagnostic_devices table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagnostic_devices' 
ORDER BY ordinal_position;

-- Check diagnostic_checks table structure
SELECT 
    'diagnostic_checks table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagnostic_checks' 
ORDER BY ordinal_position;

-- Check diagnostic_requests table structure
SELECT 
    'diagnostic_requests table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'diagnostic_requests' 
ORDER BY ordinal_position;







