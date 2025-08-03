-- Check diagnostic_devices table structure
-- Run this to see the exact columns in the diagnostic_devices table

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'diagnostic_devices'
ORDER BY ordinal_position;

-- Check if result_status column exists specifically
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'diagnostic_devices' 
                AND column_name = 'result_status'
        ) 
        THEN 'result_status column EXISTS'
        ELSE 'result_status column MISSING'
    END as result_status_check;

-- Check all columns in diagnostic_devices table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'diagnostic_devices'
ORDER BY ordinal_position; 