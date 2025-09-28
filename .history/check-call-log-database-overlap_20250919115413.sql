-- Check Call Log and Database Overlap
-- This script shows which contacts from the call log exist in your database

-- Step 1: Create temporary table with sample call log data
CREATE TEMP TABLE temp_call_log_sample AS
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

-- Step 2: Show total contacts in call log sample
SELECT 
    'Total contacts in call log sample:' as info,
    COUNT(*) as total_contacts
FROM temp_call_log_sample;

-- Step 3: Show contacts that exist in both call log and database
SELECT 
    'Contacts that exist in both call log and database:' as info,
    COUNT(*) as matching_contacts
FROM temp_call_log_sample t
JOIN customers c ON t.phone = c.phone;

-- Step 4: Show detailed list of matching contacts
SELECT 
    'Matching contacts (call log + database):' as info,
    t.phone,
    t.best_name as call_log_name,
    c.name as database_name,
    t.total_calls,
    t.loyalty_level,
    c.created_at as db_created_date,
    t.first_call_date as first_call_date
FROM temp_call_log_sample t
JOIN customers c ON t.phone = c.phone
ORDER BY t.total_calls DESC;

-- Step 5: Show contacts in call log but NOT in database
SELECT 
    'Contacts in call log but NOT in database:' as info,
    COUNT(*) as new_contacts
FROM temp_call_log_sample t
LEFT JOIN customers c ON t.phone = c.phone
WHERE c.phone IS NULL;

-- Step 6: Show detailed list of new contacts
SELECT 
    'New contacts (in call log but not in database):' as info,
    t.phone,
    t.best_name,
    t.total_calls,
    t.loyalty_level,
    t.first_call_date
FROM temp_call_log_sample t
LEFT JOIN customers c ON t.phone = c.phone
WHERE c.phone IS NULL
ORDER BY t.total_calls DESC;

-- Step 7: Show contacts in database but NOT in call log
SELECT 
    'Contacts in database but NOT in call log:' as info,
    COUNT(*) as db_only_contacts
FROM customers c
LEFT JOIN temp_call_log_sample t ON c.phone = t.phone
WHERE t.phone IS NULL
    AND c.phone LIKE '+255%';

-- Step 8: Show summary statistics
SELECT 
    'Summary Statistics:' as info,
    'Call log contacts' as category,
    COUNT(*) as count
FROM temp_call_log_sample

UNION ALL

SELECT 
    'Summary Statistics:' as info,
    'Database contacts' as category,
    COUNT(*) as count
FROM customers
WHERE phone LIKE '+255%'

UNION ALL

SELECT 
    'Summary Statistics:' as info,
    'Matching contacts' as category,
    COUNT(*) as count
FROM temp_call_log_sample t
JOIN customers c ON t.phone = c.phone

UNION ALL

SELECT 
    'Summary Statistics:' as info,
    'New contacts (call log only)' as category,
    COUNT(*) as count
FROM temp_call_log_sample t
LEFT JOIN customers c ON t.phone = c.phone
WHERE c.phone IS NULL

UNION ALL

SELECT 
    'Summary Statistics:' as info,
    'Database only contacts' as category,
    COUNT(*) as count
FROM customers c
LEFT JOIN temp_call_log_sample t ON c.phone = t.phone
WHERE t.phone IS NULL
    AND c.phone LIKE '+255%';
