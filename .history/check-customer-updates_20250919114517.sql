-- Check Customer Update Status
-- This script shows how many customers have been updated with call log data

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

-- Step 3: Show customers updated recently (within last hour)
SELECT 
    'Customers updated recently:' as info,
    COUNT(*) as recently_updated
FROM customers
WHERE updated_at > NOW() - INTERVAL '1 hour';

-- Step 4: Show loyalty level distribution
SELECT 
    'Loyalty level distribution:' as info,
    call_loyalty_level,
    COUNT(*) as customer_count
FROM customers
WHERE total_calls > 0
GROUP BY call_loyalty_level
ORDER BY 
    CASE call_loyalty_level 
        WHEN 'VIP' THEN 1 
        WHEN 'Gold' THEN 2 
        WHEN 'Silver' THEN 3 
        WHEN 'Bronze' THEN 4 
        WHEN 'Basic' THEN 5 
        WHEN 'New' THEN 6 
    END;

-- Step 5: Show customers with updated names
SELECT 
    'Customers with updated names:' as info,
    COUNT(*) as customers_with_better_names
FROM customers
WHERE name != '__' 
    AND name IS NOT NULL 
    AND total_calls > 0;

-- Step 6: Show sample of updated customers
SELECT 
    'Sample of updated customers:' as info,
    name,
    phone,
    total_calls,
    call_loyalty_level,
    updated_at
FROM customers
WHERE total_calls > 0
ORDER BY updated_at DESC
LIMIT 10;
