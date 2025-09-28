-- Run Complete Customer Update from Call Log
-- This script runs the complete update with all 11,161 customers

-- Step 1: Show current status
SELECT 
    'Current status before complete update:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN total_calls > 0 THEN 1 END) as customers_with_call_data
FROM customers;

-- Step 2: Run the complete update
-- This will update all customers with call log data
-- The actual data is in the update-all-customers-complete.sql file

-- Note: You need to run the update-all-customers-complete.sql file first
-- This script shows the results after that update

-- Step 3: Show results after complete update
SELECT 
    'Results after complete update:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN total_calls > 0 THEN 1 END) as customers_with_call_data
FROM customers;

-- Step 4: Show loyalty level distribution
SELECT 
    'Loyalty level distribution:' as info,
    call_loyalty_level,
    COUNT(*) as customer_count,
    ROUND(AVG(total_calls), 1) as avg_calls,
    ROUND(AVG(total_call_duration_minutes), 1) as avg_duration_minutes
FROM customers
WHERE call_loyalty_level IS NOT NULL
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

-- Step 5: Show top customers
SELECT 
    'Top customers by call activity:' as info,
    name,
    phone,
    total_calls,
    ROUND(total_call_duration_minutes, 1) as total_duration_minutes,
    call_loyalty_level
FROM customers
WHERE total_calls > 0
ORDER BY total_calls DESC, total_call_duration_minutes DESC
LIMIT 20;

-- Step 6: Show business insights
SELECT 
    'Business Insights:' as info,
    'Total customers with call data' as metric,
    COUNT(*) as value
FROM customers
WHERE total_calls > 0

UNION ALL

SELECT 
    'Business Insights:' as info,
    'VIP customers (100+ calls)' as metric,
    COUNT(*) as value
FROM customers
WHERE call_loyalty_level = 'VIP'

UNION ALL

SELECT 
    'Business Insights:' as info,
    'Gold customers (50+ calls)' as metric,
    COUNT(*) as value
FROM customers
WHERE call_loyalty_level = 'Gold'

UNION ALL

SELECT 
    'Business Insights:' as info,
    'Total call minutes' as metric,
    ROUND(SUM(total_call_duration_minutes), 0) as value
FROM customers
WHERE total_calls > 0

UNION ALL

SELECT 
    'Business Insights:' as info,
    'Average calls per customer' as metric,
    ROUND(AVG(total_calls), 1) as value
FROM customers
WHERE total_calls > 0;
