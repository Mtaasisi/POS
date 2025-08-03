-- Test database access for all tables
-- This script verifies that all tables are accessible and working

-- Test redemption_rewards table
SELECT 'redemption_rewards' as table_name, COUNT(*) as record_count FROM redemption_rewards;

-- Test redemption_transactions table
SELECT 'redemption_transactions' as table_name, COUNT(*) as record_count FROM redemption_transactions;

-- Test other key tables
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers;
SELECT 'devices' as table_name, COUNT(*) as record_count FROM devices;
SELECT 'device_checklists' as table_name, COUNT(*) as record_count FROM device_checklists;
SELECT 'device_attachments' as table_name, COUNT(*) as record_count FROM device_attachments;
SELECT 'inventory_products' as table_name, COUNT(*) as record_count FROM inventory_products;
SELECT 'spare_parts' as table_name, COUNT(*) as record_count FROM spare_parts;

-- Test table structure
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('redemption_rewards', 'redemption_transactions')
ORDER BY table_name, ordinal_position;

-- Test RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'redemption_rewards'
ORDER BY policyname; 