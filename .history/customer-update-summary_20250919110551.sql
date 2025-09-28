-- Customer Update Summary
-- This script shows the final status after all updates

-- 1. Show total customer count
SELECT 
    'Total customers in database:' as info,
    COUNT(*) as total_customers
FROM customers;

-- 2. Show Tanzanian phone numbers (should all start with +255)
SELECT 
    'Tanzanian phone numbers (should start with +255):' as info,
    COUNT(*) as tanzanian_phones
FROM customers
WHERE phone LIKE '+255%';

-- 3. Show international phone numbers (legitimate, should remain as-is)
SELECT 
    'International phone numbers (legitimate):' as info,
    COUNT(*) as international_phones
FROM customers
WHERE phone IS NOT NULL 
    AND phone != '' 
    AND phone NOT LIKE '+255%'
    AND phone LIKE '+%';

-- 4. Show any remaining problematic phone numbers (should be 0)
SELECT 
    'Problematic phone numbers (should be 0):' as info,
    COUNT(*) as problematic_phones
FROM customers
WHERE phone IS NOT NULL 
    AND phone != '' 
    AND phone NOT LIKE '+%'
    AND phone NOT LIKE '255%';

-- 5. Show sample of updated customers with proper names and locations
SELECT 
    'Sample of updated customers:' as info,
    id, 
    name, 
    phone, 
    city, 
    updated_at
FROM customers
WHERE name != '__' 
    AND name IS NOT NULL 
    AND city IS NOT NULL
    AND phone LIKE '+255%'
ORDER BY updated_at DESC
LIMIT 10;

-- 6. Show customers with placeholder names that still need updating
SELECT 
    'Customers with placeholder names (still need updating):' as info,
    COUNT(*) as placeholder_count
FROM customers
WHERE name = '__' OR name IS NULL;

-- 7. Show customers without city information
SELECT 
    'Customers without city information:' as info,
    COUNT(*) as no_city_count
FROM customers
WHERE city IS NULL OR city = '';
