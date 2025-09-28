-- Run Full Call Log Import
-- This script runs the complete import with all 11,158 customers

-- Step 1: Show current status
SELECT 
    'Current status before full import:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN total_calls > 0 THEN 1 END) as customers_with_call_data
FROM customers;

-- Step 2: Run the full import
-- This will import all 11,158 customers from the call log
-- The data is in the import-call-log-generated.sql file

-- Note: You need to run the import-call-log-generated.sql file first
-- This script shows the results after that import

-- Step 3: Show results after full import
SELECT 
    'Results after full import:' as info,
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
