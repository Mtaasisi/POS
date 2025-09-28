-- Diagnostic script to understand the data integrity issues
-- Run this first to see what's happening with your diagnostic data

-- Check if tables exist
SELECT 
    'Table existence check:' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diagnostic_requests') 
         THEN 'EXISTS' ELSE 'MISSING' END as diagnostic_requests,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diagnostic_devices') 
         THEN 'EXISTS' ELSE 'MISSING' END as diagnostic_devices,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diagnostic_checks') 
         THEN 'EXISTS' ELSE 'MISSING' END as diagnostic_checks;

-- Count records in each table
SELECT 
    'Record counts:' as info,
    (SELECT COUNT(*) FROM diagnostic_requests) as diagnostic_requests_count,
    (SELECT COUNT(*) FROM diagnostic_devices) as diagnostic_devices_count,
    (SELECT COUNT(*) FROM diagnostic_checks) as diagnostic_checks_count;

-- Check for orphaned diagnostic_checks records
SELECT 
    'Orphaned diagnostic_checks:' as info,
    COUNT(*) as orphaned_count
FROM diagnostic_checks dc
LEFT JOIN diagnostic_devices dd ON dc.diagnostic_device_id = dd.id
WHERE dd.id IS NULL;

-- Show details of orphaned records
SELECT 
    'Orphaned record details:' as info,
    dc.id,
    dc.diagnostic_device_id,
    dc.test_item,
    dc.result,
    dc.created_at
FROM diagnostic_checks dc
LEFT JOIN diagnostic_devices dd ON dc.diagnostic_device_id = dd.id
WHERE dd.id IS NULL
LIMIT 10;

-- Check for orphaned diagnostic_devices records
SELECT 
    'Orphaned diagnostic_devices:' as info,
    COUNT(*) as orphaned_count
FROM diagnostic_devices dd
LEFT JOIN diagnostic_requests dr ON dd.diagnostic_request_id = dr.id
WHERE dr.id IS NULL;

-- Check foreign key constraints
SELECT 
    'Existing foreign key constraints:' as info,
    tc.constraint_name,
    tc.table_name,
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
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('diagnostic_requests', 'diagnostic_devices', 'diagnostic_checks')
ORDER BY tc.table_name, tc.constraint_name;









