-- Import Full Call Log Data
-- This script imports all 11,158 customers from the call log

-- Step 1: Show current status
SELECT 
    'Current status before full import:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN total_calls > 0 THEN 1 END) as customers_with_call_data
FROM customers;

-- Step 2: Import the full call log data
-- This will create a temporary table with all 11,158 customers from the call log
-- The data is from the generated SQL file

-- Note: You need to run the import-call-log-generated.sql file first
-- This script assumes that file has been executed

-- Step 3: Show analysis after full import
SELECT 
    'Call Log Analysis after full import:' as info,
    COUNT(*) as customers_with_call_data
FROM customers
WHERE total_calls > 0;

-- Step 4: Show loyalty level distribution
SELECT 
    'Loyalty level distribution after full import:' as info,
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

-- Step 5: Show top customers by call activity
SELECT 
    'Top 20 customers by call activity:' as info,
    name,
    phone,
    total_calls,
    ROUND(total_call_duration_minutes, 1) as total_duration_minutes,
    call_loyalty_level,
    first_call_date,
    last_call_date
FROM customers
WHERE total_calls > 0
ORDER BY total_calls DESC, total_call_duration_minutes DESC
LIMIT 20;

-- Step 6: Show customers with updated names
SELECT 
    'Customers with updated names from call log:' as info,
    COUNT(*) as customers_with_better_names
FROM customers
WHERE name != '__' 
    AND name IS NOT NULL 
    AND total_calls > 0;

-- Step 7: Show sample of updated customers
SELECT 
    'Sample of updated customers:' as info,
    name,
    phone,
    created_at,
    first_call_date,
    total_calls,
    call_loyalty_level
FROM customers
WHERE total_calls > 0
ORDER BY total_calls DESC
LIMIT 15;

-- Step 8: Show business insights
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
