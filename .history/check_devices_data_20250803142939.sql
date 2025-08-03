-- Check devices table structure and data
-- This script shows the current state of the devices table

-- Show devices table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'devices'
ORDER BY ordinal_position;

-- Show sample data from devices table (first 5 rows)
SELECT 
    id,
    brand,
    model,
    serial_number,
    issue_description,
    status,
    assigned_to,
    unlock_code,
    repair_cost,
    deposit_amount,
    diagnosis_required,
    device_notes,
    device_cost,
    estimated_hours,
    device_condition,
    created_at
FROM devices 
ORDER BY created_at DESC 
LIMIT 5;

-- Count total devices
SELECT COUNT(*) as total_devices FROM devices;

-- Check which fields have data
SELECT 
    'unlock_code' as field_name,
    COUNT(CASE WHEN unlock_code IS NOT NULL AND unlock_code != '' THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'repair_cost' as field_name,
    COUNT(CASE WHEN repair_cost IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'deposit_amount' as field_name,
    COUNT(CASE WHEN deposit_amount IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'diagnosis_required' as field_name,
    COUNT(CASE WHEN diagnosis_required = true THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'device_notes' as field_name,
    COUNT(CASE WHEN device_notes IS NOT NULL AND device_notes != '' THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'device_cost' as field_name,
    COUNT(CASE WHEN device_cost IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'estimated_hours' as field_name,
    COUNT(CASE WHEN estimated_hours IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices
UNION ALL
SELECT 
    'device_condition' as field_name,
    COUNT(CASE WHEN device_condition IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM devices; 