-- Diagnose Customer Updates
-- This script shows why only certain customers were updated

-- Step 1: Show total customers in database
SELECT 
    'Total customers in database:' as info,
    COUNT(*) as total_customers
FROM customers;

-- Step 2: Show customers with call log data
SELECT 
    'Customers with call log data:' as info,
    COUNT(*) as customers_with_call_data
FROM customers
WHERE total_calls > 0;

-- Step 3: Show customers without call log data
SELECT 
    'Customers without call log data:' as info,
    COUNT(*) as customers_without_call_data
FROM customers
WHERE total_calls = 0 OR total_calls IS NULL;

-- Step 4: Show customers with placeholder names
SELECT 
    'Customers with placeholder names:' as info,
    COUNT(*) as customers_with_placeholder_names
FROM customers
WHERE name = '__' OR name IS NULL;

-- Step 5: Show customers with proper names
SELECT 
    'Customers with proper names:' as info,
    COUNT(*) as customers_with_proper_names
FROM customers
WHERE name != '__' AND name IS NOT NULL;

-- Step 6: Show customers updated recently
SELECT 
    'Customers updated recently (last hour):' as info,
    COUNT(*) as recently_updated
FROM customers
WHERE updated_at > NOW() - INTERVAL '1 hour';

-- Step 7: Show customers updated today
SELECT 
    'Customers updated today:' as info,
    COUNT(*) as updated_today
FROM customers
WHERE updated_at::date = CURRENT_DATE;

-- Step 8: Show all customers with call data (not just sample)
SELECT 
    'All customers with call data:' as info,
    name,
    phone,
    total_calls,
    call_loyalty_level,
    updated_at
FROM customers
WHERE total_calls > 0
ORDER BY total_calls DESC;

-- Step 9: Show customers who should have been updated but weren't
SELECT 
    'Customers who should have call data but don\'t:' as info,
    name,
    phone,
    created_at,
    updated_at
FROM customers
WHERE (name != '__' AND name IS NOT NULL)
    AND (total_calls = 0 OR total_calls IS NULL)
    AND phone LIKE '+255%'
ORDER BY created_at DESC
LIMIT 20;

-- Step 10: Show phone number format analysis
SELECT 
    'Phone number format analysis:' as info,
    CASE 
        WHEN phone LIKE '+255%' THEN 'Tanzanian (+255)'
        WHEN phone LIKE '+%' THEN 'International (+country)'
        WHEN phone LIKE '255%' THEN 'Tanzanian (255)'
        WHEN phone IS NULL OR phone = '' THEN 'No phone'
        ELSE 'Other format'
    END as phone_format,
    COUNT(*) as count
FROM customers
GROUP BY 
    CASE 
        WHEN phone LIKE '+255%' THEN 'Tanzanian (+255)'
        WHEN phone LIKE '+%' THEN 'International (+country)'
        WHEN phone LIKE '255%' THEN 'Tanzanian (255)'
        WHEN phone IS NULL OR phone = '' THEN 'No phone'
        ELSE 'Other format'
    END
ORDER BY count DESC;
