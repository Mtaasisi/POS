-- Show customers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Show devices table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- Show customer_notes table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customer_notes' 
ORDER BY ordinal_position;

-- Show customer_payments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
ORDER BY ordinal_position;

-- Show promo_messages table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'promo_messages' 
ORDER BY ordinal_position;

-- Count records in each table
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'devices' as table_name, COUNT(*) as record_count FROM devices
UNION ALL
SELECT 'customer_notes' as table_name, COUNT(*) as record_count FROM customer_notes
UNION ALL
SELECT 'customer_payments' as table_name, COUNT(*) as record_count FROM customer_payments
UNION ALL
SELECT 'promo_messages' as table_name, COUNT(*) as record_count FROM promo_messages; 