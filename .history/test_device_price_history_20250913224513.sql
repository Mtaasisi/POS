-- Test script for device price history setup
-- Run this to debug any issues

-- 1. Check if devices table exists and has repair_price column
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'devices' 
AND column_name IN ('repair_price', 'id', 'brand', 'model', 'serial_number')
ORDER BY column_name;

-- 2. Check if device_price_history table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'device_price_history';

-- 3. If device_price_history exists, check its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'device_price_history'
ORDER BY ordinal_position;

-- 4. Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'device_price_change_trigger';

-- 5. Check if function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'log_device_price_change';

-- 6. Test manual insert (if table exists)
-- Uncomment the following lines to test manual insert:
/*
INSERT INTO device_price_history (
    device_id,
    old_price,
    new_price,
    reason,
    change_type,
    source,
    metadata
) VALUES (
    (SELECT id FROM devices LIMIT 1),
    0,
    1000,
    'Manual test entry',
    'manual',
    'admin',
    '{"test": true}'::jsonb
);
*/

-- 7. Check recent price history entries
SELECT 
    id,
    device_id,
    old_price,
    new_price,
    price_change,
    change_percentage,
    reason,
    change_type,
    source,
    created_at
FROM device_price_history 
ORDER BY created_at DESC 
LIMIT 5;
