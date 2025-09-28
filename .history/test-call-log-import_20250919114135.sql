-- Test Call Log Import with Sample Data
-- This script imports sample call log data to test the system

-- Step 1: Show current status
SELECT 
    'Current customer count:' as info,
    COUNT(*) as total_customers
FROM customers;

-- Step 2: Create temporary table with sample call log data
CREATE TEMP TABLE temp_call_log_processed AS
SELECT * FROM (VALUES
('+255745099313', 'PROSPER MASIKA', '2023-10-13 18:39:16', '2024-07-08 08:51:03', 296, 28, 249, 12, 94.14, 0.32, 'Silver'),
('+255716508450', 'Dallaz', '2023-10-13 21:02:37', '2024-01-11 20:31:32', 55, 33, 11, 11, 48.85, 0.89, 'Bronze'),
('+255712858344', 'Emanuel Masoko Kaputi', '2023-10-14 11:19:30', '2025-08-30 12:45:56', 265, 85, 162, 17, 112.52, 0.42, 'Silver'),
('+255655798461', 'Ammy Online Store Tz', '2023-10-14 11:53:00', '2025-07-11 09:56:59', 356, 114, 223, 18, 182.78, 0.51, 'Gold'),
('+255746605561', 'Mtaasisi', '2023-10-14 19:25:56', '2025-09-12 22:46:29', 505, 95, 383, 25, 361.31, 0.72, 'VIP'),
('+255654841225', 'Zana boda boda', '2023-10-14 19:49:19', '2025-06-21 20:05:21', 1468, 397, 929, 141, 607.42, 0.41, 'VIP')
) AS call_data(phone, best_name, first_call_date, last_call_date, total_calls, incoming_calls, outgoing_calls, missed_calls, total_duration_minutes, avg_duration_minutes, loyalty_level);

-- Step 3: Show analysis of call log data
SELECT 
    'Call Log Analysis:' as info,
    COUNT(*) as unique_phone_numbers,
    COUNT(CASE WHEN loyalty_level = 'VIP' THEN 1 END) as vip_customers,
    COUNT(CASE WHEN loyalty_level = 'Gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'Silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'Bronze' THEN 1 END) as bronze_customers
FROM temp_call_log_processed;

-- Step 4: Show which customers will be updated
SELECT 
    'Customers that will be updated:' as info,
    c.phone,
    c.name as current_name,
    t.best_name as new_name,
    t.total_calls,
    t.loyalty_level
FROM customers c
JOIN temp_call_log_processed t ON c.phone = t.phone;

-- Step 5: Update existing customers with call log data
UPDATE customers 
SET 
    name = CASE 
        WHEN customers.name = '__' OR customers.name IS NULL OR 
             (t.best_name IS NOT NULL AND t.best_name != 'Unknown' AND LENGTH(t.best_name) > LENGTH(customers.name)) 
        THEN COALESCE(t.best_name, customers.name)
        ELSE customers.name 
    END,
    created_at = COALESCE(t.first_call_date::timestamp, customers.created_at),
    total_calls = t.total_calls,
    total_call_duration_minutes = t.total_duration_minutes,
    incoming_calls = t.incoming_calls,
    outgoing_calls = t.outgoing_calls,
    missed_calls = t.missed_calls,
    avg_call_duration_minutes = t.avg_duration_minutes,
    first_call_date = t.first_call_date::timestamp,
    last_call_date = t.last_call_date::timestamp,
    call_loyalty_level = t.loyalty_level,
    last_visit = t.last_call_date::timestamp,
    updated_at = NOW()
FROM temp_call_log_processed t
WHERE customers.phone = t.phone;

-- Step 6: Show customers that were updated
SELECT 
    'Updated customers from call log:' as info,
    COUNT(*) as customers_updated
FROM customers c
JOIN temp_call_log_processed t ON c.phone = t.phone
WHERE c.updated_at > NOW() - INTERVAL '1 minute';

-- Step 7: Show sample of updated customers
SELECT 
    'Sample of updated customers:' as info,
    c.id,
    c.name,
    c.phone,
    c.created_at,
    c.last_visit,
    c.total_calls,
    c.total_call_duration_minutes,
    c.call_loyalty_level
FROM customers c
JOIN temp_call_log_processed t ON c.phone = t.phone
WHERE c.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY c.total_calls DESC
LIMIT 10;

-- Step 8: Show loyalty level distribution
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
