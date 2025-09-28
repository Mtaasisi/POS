-- Update Loyalty Levels Based on Custom Criteria
-- Silver: Customers who called more than 2 days
-- Bronze: Customers who called only once

-- Step 1: Show current loyalty distribution
SELECT 
    'Current loyalty distribution:' as info,
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

-- Step 2: Show customers who called more than 2 days (should be Silver)
SELECT 
    'Customers who called more than 2 days (should be Silver):' as info,
    name,
    phone,
    total_calls,
    first_call_date,
    last_call_date,
    (last_call_date::date - first_call_date::date) as days_span,
    call_loyalty_level
FROM customers
WHERE total_calls > 0
    AND (last_call_date::date - first_call_date::date) > 2
ORDER BY days_span DESC;

-- Step 3: Show customers who called only once (should be Bronze)
SELECT 
    'Customers who called only once (should be Bronze):' as info,
    name,
    phone,
    total_calls,
    first_call_date,
    last_call_date,
    call_loyalty_level
FROM customers
WHERE total_calls = 1
ORDER BY first_call_date;

-- Step 4: Update loyalty levels based on new criteria
UPDATE customers 
SET 
    call_loyalty_level = CASE 
        -- VIP: Keep existing VIP customers (100+ calls, 300+ minutes)
        WHEN total_calls >= 100 AND total_call_duration_minutes >= 300 THEN 'VIP'
        -- Gold: Keep existing Gold customers (50+ calls, 150+ minutes)
        WHEN total_calls >= 50 AND total_call_duration_minutes >= 150 THEN 'Gold'
        -- Silver: Customers who called more than 2 days
        WHEN (last_call_date::date - first_call_date::date) > 2 THEN 'Silver'
        -- Bronze: Customers who called only once
        WHEN total_calls = 1 THEN 'Bronze'
        -- Basic: All other customers with calls
        WHEN total_calls > 1 THEN 'Basic'
        -- New: Customers with no calls
        ELSE 'New'
    END,
    updated_at = NOW()
WHERE total_calls > 0;

-- Step 5: Show updated loyalty distribution
SELECT 
    'Updated loyalty distribution:' as info,
    call_loyalty_level,
    COUNT(*) as customer_count,
    ROUND(AVG(total_calls), 1) as avg_calls,
    ROUND(AVG(total_call_duration_minutes), 1) as avg_duration_minutes
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

-- Step 6: Show customers by new loyalty levels
SELECT 
    'Silver customers (called more than 2 days):' as info,
    name,
    phone,
    total_calls,
    (last_call_date::date - first_call_date::date) as days_span,
    total_call_duration_minutes
FROM customers
WHERE call_loyalty_level = 'Silver'
ORDER BY days_span DESC, total_calls DESC
LIMIT 10;

SELECT 
    'Bronze customers (called only once):' as info,
    name,
    phone,
    total_calls,
    first_call_date,
    total_call_duration_minutes
FROM customers
WHERE call_loyalty_level = 'Bronze'
ORDER BY first_call_date DESC
LIMIT 10;

-- Step 7: Show summary of changes
SELECT 
    'Summary of loyalty level changes:' as info,
    'Silver (more than 2 days)' as criteria,
    COUNT(*) as count
FROM customers
WHERE call_loyalty_level = 'Silver'

UNION ALL

SELECT 
    'Summary of loyalty level changes:' as info,
    'Bronze (called only once)' as criteria,
    COUNT(*) as count
FROM customers
WHERE call_loyalty_level = 'Bronze'

UNION ALL

SELECT 
    'Summary of loyalty level changes:' as info,
    'VIP (100+ calls, 300+ minutes)' as criteria,
    COUNT(*) as count
FROM customers
WHERE call_loyalty_level = 'VIP'

UNION ALL

SELECT 
    'Summary of loyalty level changes:' as info,
    'Gold (50+ calls, 150+ minutes)' as criteria,
    COUNT(*) as count
FROM customers
WHERE call_loyalty_level = 'Gold'

UNION ALL

SELECT 
    'Summary of loyalty level changes:' as info,
    'Basic (other customers with calls)' as criteria,
    COUNT(*) as count
FROM customers
WHERE call_loyalty_level = 'Basic';
