-- Import Call Log Data - Clean Version
-- This script imports call log data without any problematic syntax

-- Step 1: Show current status
SELECT 
    'Current customer count:' as info,
    COUNT(*) as total_customers
FROM customers;

-- Step 2: Create temporary table with sample call log data
CREATE TEMP TABLE temp_call_log_processed AS
SELECT * FROM (VALUES
('+255745099313', 'PROSPER MASIKA', '2023-10-13 18:39:16', '2024-07-08 08:51:03', 296, 28, 249, 12, 94.14, 0.32, 'Silver'),
('+255757800444', 'Unknown', '2023-10-13 18:47:17', '2024-03-08 19:06:50', 3, 0, 2, 1, 0.00, 0.00, 'New'),
('+255622775790', 'Unknown', '2023-10-13 18:48:24', '2023-10-13 18:48:24', 1, 1, 0, 0, 0.72, 0.72, 'New'),
('+255659951216', 'Hamid Ufundi XR', '2023-10-13 18:50:17', '2024-09-18 19:34:35', 7, 4, 2, 1, 4.75, 0.68, 'Basic'),
('+255626361390', 'Unknown', '2023-10-13 19:23:44', '2023-10-13 19:23:44', 1, 0, 1, 0, 0.00, 0.00, 'New'),
('+255693576739', 'Unknown', '2023-10-13 19:43:52', '2023-10-13 19:43:52', 1, 1, 0, 0, 0.30, 0.30, 'New'),
('+255684773715', 'Unknown', '2023-10-13 19:59:39', '2023-10-16 10:54:23', 3, 1, 1, 1, 0.93, 0.31, 'New'),
('+255772121275', 'Unknown', '2023-10-13 20:06:44', '2023-10-13 20:06:44', 1, 1, 0, 0, 0.63, 0.63, 'New'),
('+255716508450', 'Dallaz', '2023-10-13 21:02:37', '2024-01-11 20:31:32', 55, 33, 11, 11, 48.85, 0.89, 'Bronze'),
('+255677202522', 'Celina Keds Export', '2023-10-13 22:14:15', '2023-10-16 10:55:21', 7, 1, 2, 4, 1.30, 0.19, 'Basic'),
('+255763524811', 'Karata Afsa Afya Kimara', '2023-10-13 22:37:02', '2023-10-17 22:22:10', 3, 0, 1, 2, 0.00, 0.00, 'New'),
('+255783776828', 'Unknown', '2023-10-14 10:07:20', '2023-10-14 11:50:16', 3, 3, 0, 0, 1.45, 0.48, 'New'),
('+255718409409', 'Ziddie', '2023-10-14 10:47:04', '2023-10-14 12:58:01', 2, 2, 0, 0, 0.86, 0.43, 'New'),
('+255712858344', 'Emanuel Masoko Kaputi', '2023-10-14 11:19:30', '2025-08-30 12:45:56', 265, 85, 162, 17, 112.52, 0.42, 'Silver'),
('+255655798461', 'Ammy Online Store Tz', '2023-10-14 11:53:00', '2025-07-11 09:56:59', 356, 114, 223, 18, 182.78, 0.51, 'Gold'),
('+255767663909', 'Timeless International', '2023-10-14 12:31:29', '2023-10-14 22:22:45', 11, 4, 7, 0, 5.99, 0.54, 'Basic'),
('+255653198424', 'Unknown', '2023-10-14 12:38:44', '2023-10-14 12:38:44', 1, 1, 0, 0, 0.67, 0.67, 'New'),
('+255719788454', 'JAMAL FERUZI', '2023-10-14 12:44:26', '2025-01-15 21:09:33', 4, 1, 2, 1, 1.44, 0.36, 'New'),
('+255719165666', '+255719165666', '2023-10-14 12:56:53', '2024-04-15 12:38:52', 30, 15, 8, 7, 27.77, 0.93, 'Bronze'),
('+255683404067', 'Shabiri Laptop Accer', '2023-10-14 13:16:42', '2023-10-14 21:48:18', 4, 2, 2, 0, 5.23, 1.31, 'New'),
('+255718880033', 'Ebrahim Manso', '2023-10-14 13:30:27', '2023-10-14 13:30:27', 1, 1, 0, 0, 1.97, 1.97, 'New'),
('+255749512512', 'Joha Voda Wasumbufu', '2023-10-14 13:42:49', '2023-11-21 16:37:45', 4, 3, 1, 0, 7.00, 1.75, 'New'),
('+255712739618', 'Khalifa Athumani', '2023-10-14 14:21:16', '2025-08-03 20:25:02', 18, 7, 8, 3, 8.48, 0.47, 'Basic'),
('+255746671027', 'Unknown', '2023-10-14 15:21:50', '2023-10-14 15:27:19', 2, 2, 0, 0, 1.70, 0.85, 'New'),
('+255758792494', 'Abillai Azan', '2023-10-14 15:34:51', '2023-11-02 10:10:08', 10, 3, 4, 3, 3.51, 0.35, 'Basic'),
('+255713002650', 'Unknown', '2023-10-14 16:53:12', '2024-09-20 10:49:41', 4, 3, 1, 0, 3.09, 0.77, 'New'),
('+255744317191', 'Unknown', '2023-10-14 17:05:06', '2023-10-14 17:05:06', 1, 1, 0, 0, 0.30, 0.30, 'New'),
('+255784215259', 'A Woman Of Vision', '2023-10-14 19:23:43', '2025-01-02 20:35:46', 10, 6, 2, 2, 11.16, 1.12, 'Basic'),
('+255746605561', 'Mtaasisi', '2023-10-14 19:25:56', '2025-09-12 22:46:29', 505, 95, 383, 25, 361.31, 0.72, 'VIP'),
('+255686726262', 'Michael G Bo', '2023-10-14 19:31:40', '2025-07-15 13:53:37', 7, 3, 2, 2, 1.42, 0.20, 'Basic'),
('+255753898000', 'Gerry', '2023-10-14 19:36:44', '2024-02-20 12:20:41', 5, 3, 1, 1, 2.20, 0.44, 'Basic'),
('+255768939311', '+255768939311', '2023-10-14 19:47:29', '2024-11-06 10:27:51', 16, 6, 9, 1, 14.56, 0.91, 'Basic'),
('+255654841225', 'Zana boda boda', '2023-10-14 19:49:19', '2025-06-21 20:05:21', 1468, 397, 929, 141, 607.42, 0.41, 'VIP')
) AS call_data(phone, best_name, first_call_date, last_call_date, total_calls, incoming_calls, outgoing_calls, missed_calls, total_duration_minutes, avg_duration_minutes, loyalty_level);

-- Step 3: Show analysis of call log data
SELECT 
    'Call Log Analysis:' as info,
    COUNT(*) as unique_phone_numbers,
    COUNT(CASE WHEN loyalty_level = 'VIP' THEN 1 END) as vip_customers,
    COUNT(CASE WHEN loyalty_level = 'Gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'Silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'Bronze' THEN 1 END) as bronze_customers,
    COUNT(CASE WHEN loyalty_level = 'Basic' THEN 1 END) as basic_customers,
    COUNT(CASE WHEN loyalty_level = 'New' THEN 1 END) as new_customers
FROM temp_call_log_processed;

-- Step 4: Update existing customers with call log data
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

-- Step 5: Show customers that were updated
SELECT 
    'Updated customers from call log:' as info,
    COUNT(*) as customers_updated
FROM customers c
JOIN temp_call_log_processed t ON c.phone = t.phone
WHERE c.updated_at > NOW() - INTERVAL '1 minute';

-- Step 6: Show sample of updated customers
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
LIMIT 15;

-- Step 7: Show loyalty level distribution
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

-- Step 8: Show top customers by call activity
SELECT 
    'Top customers by call activity:' as info,
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
