-- Update Customers from Call Log
-- This script processes the call log to update customer information with:
-- 1. Better names from call log
-- 2. First call date (for created_at)
-- 3. Last call date
-- 4. Call frequency and duration
-- 5. Loyalty level based on call activity

-- Step 1: Create temporary table with processed call log data
CREATE TEMP TABLE temp_call_log AS
WITH call_data AS (
    -- Parse the call log data (you'll need to import this from CSV)
    SELECT 
        TRIM(REGEXP_REPLACE("Name", '\|.*$', '')) as name, -- Remove everything after | to get clean name
        CASE 
            WHEN "To Number" LIKE '+255%' THEN "To Number"
            WHEN "To Number" LIKE '255%' THEN '+' || "To Number"
            WHEN LENGTH("To Number") = 9 THEN '+255' || "To Number"
            ELSE '+255' || "To Number"
        END as phone,
        "Date Time"::timestamp as call_datetime,
        CASE 
            WHEN "Duration" LIKE '%h%' THEN 
                EXTRACT(EPOCH FROM (
                    INTERVAL '0 hours' + 
                    INTERVAL SPLIT_PART(SPLIT_PART("Duration", 'h', 1), ' ', 2) || ' hours' +
                    INTERVAL SPLIT_PART(SPLIT_PART("Duration", 'm', 1), ' ', 2) || ' minutes' +
                    INTERVAL SPLIT_PART(SPLIT_PART("Duration", 's', 1), ' ', 2) || ' seconds'
                )) / 60
            ELSE 0
        END as duration_minutes,
        "Type" as call_type
    FROM (
        -- Sample data from your call log (you'll need to import the full CSV)
        VALUES 
        ('PROSPER MASIKA', '+255745099313', '2023-10-13 18:39:16'::timestamp, 0.07, 'Outgoing'),
        ('Hamid Ufundi XR', '+255659951216', '2023-10-13 18:50:17'::timestamp, 0.3, 'Incoming'),
        ('Dallaz', '+255716508450', '2023-10-13 21:02:37'::timestamp, 5.45, 'Incoming'),
        ('Celina Keds Export', '+255677202522', '2023-10-13 22:14:15'::timestamp, 0, 'Missed'),
        ('Karata Afsa Afya Kimara', '+255763524811', '2023-10-13 22:37:02'::timestamp, 0, 'Missed'),
        ('Ziddie', '+255718409409', '2023-10-14 10:47:04'::timestamp, 0.53, 'Incoming'),
        ('Simukitaa | Emanuel Masoko Kaputi', '+255712858344', '2023-10-14 11:19:30'::timestamp, 0.52, 'Outgoing'),
        ('Ammy Online Store Tz | Ammy Store | Playgod🤓', '+255655798461', '2023-10-14 11:53:00'::timestamp, 1.8, 'Outgoing'),
        ('Timeless International | TIMELESS INTERNATIONAL', '+255767663909', '2023-10-14 12:31:29'::timestamp, 0, 'Outgoing'),
        ('ᴊᴀᴍᴀʟ -͓̽ 𝐅ᴇʀᴜᴢɪ 🏀 | New', '+255719788454', '2023-10-14 12:44:26'::timestamp, 0.87, 'Incoming'),
        ('Charrylee', '+255719165666', '2023-10-14 12:56:53'::timestamp, 1.23, 'Incoming'),
        ('Shabiri Laptop Accer', '+255683404067', '2023-10-14 13:16:42'::timestamp, 3.77, 'Incoming'),
        ('Ebrahim Manso', '+255718880033', '2023-10-14 13:30:27'::timestamp, 1.97, 'Incoming'),
        ('Joha Voda Wasumbufu | Jokha Amin', '+255749512512', '2023-10-14 13:42:49'::timestamp, 1.03, 'Incoming'),
        ('Khalifa Athumani', '+255712739618', '2023-10-14 14:21:16'::timestamp, 0.32, 'Incoming'),
        ('Abillai Azan', '+255758792494', '2023-10-14 15:34:51'::timestamp, 0.32, 'Incoming'),
        ('Michael G Bo', '+255686726262', '2023-10-14 19:31:40'::timestamp, 0.37, 'Incoming'),
        ('Gerry | Gerry Electronics | Gerald Lema', '+255753898000', '2023-10-14 19:36:44'::timestamp, 0.33, 'Incoming'),
        ('Gracie', '+255768939311', '2023-10-14 19:47:29'::timestamp, 1.1, 'Incoming'),
        ('Zana boda boda | Zannah Delivery,Company', '+255654841225', '2023-10-14 19:49:19'::timestamp, 0.37, 'Outgoing'),
        ('inauzwa | Inauzwa Mtaasisi | Inauzwa Sir | Mtaasisi Mkuu | Van | Samuel Masika Voda', '+255746605561', '2023-10-14 19:25:56'::timestamp, 0.52, 'Outgoing')
        -- Add more sample data here or import the full CSV
    ) AS sample_data(name, phone, call_datetime, duration_minutes, call_type)
    WHERE phone IS NOT NULL AND phone != ''
),
aggregated_calls AS (
    SELECT 
        phone,
        -- Get the best name (longest, most descriptive)
        (ARRAY_AGG(name ORDER BY LENGTH(name) DESC, name))[1] as best_name,
        -- Get first and last call dates
        MIN(call_datetime) as first_call_date,
        MAX(call_datetime) as last_call_date,
        -- Calculate call statistics
        COUNT(*) as total_calls,
        COUNT(CASE WHEN call_type = 'Incoming' THEN 1 END) as incoming_calls,
        COUNT(CASE WHEN call_type = 'Outgoing' THEN 1 END) as outgoing_calls,
        COUNT(CASE WHEN call_type = 'Missed' THEN 1 END) as missed_calls,
        SUM(duration_minutes) as total_duration_minutes,
        AVG(duration_minutes) as avg_duration_minutes,
        -- Calculate loyalty level based on call activity
        CASE 
            WHEN COUNT(*) >= 50 AND SUM(duration_minutes) >= 100 THEN 'VIP'
            WHEN COUNT(*) >= 20 AND SUM(duration_minutes) >= 50 THEN 'Gold'
            WHEN COUNT(*) >= 10 AND SUM(duration_minutes) >= 20 THEN 'Silver'
            WHEN COUNT(*) >= 5 THEN 'Bronze'
            ELSE 'Basic'
        END as loyalty_level
    FROM call_data
    GROUP BY phone
)
SELECT * FROM aggregated_calls;

-- Step 2: Show analysis of call log data
SELECT 
    'Call Log Analysis:' as info,
    COUNT(*) as unique_phone_numbers,
    COUNT(CASE WHEN loyalty_level = 'VIP' THEN 1 END) as vip_customers,
    COUNT(CASE WHEN loyalty_level = 'Gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'Silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'Bronze' THEN 1 END) as bronze_customers,
    COUNT(CASE WHEN loyalty_level = 'Basic' THEN 1 END) as basic_customers
FROM temp_call_log;

-- Step 3: Show sample of processed call log data
SELECT 
    'Sample processed call log data:' as info,
    phone,
    best_name,
    first_call_date,
    last_call_date,
    total_calls,
    total_duration_minutes,
    loyalty_level
FROM temp_call_log
ORDER BY total_calls DESC, total_duration_minutes DESC
LIMIT 10;

-- Step 4: Update existing customers with call log data
UPDATE customers 
SET 
    -- Update name if call log has a better name
    name = CASE 
        WHEN customers.name = '__' OR customers.name IS NULL OR LENGTH(t.best_name) > LENGTH(customers.name) 
        THEN t.best_name 
        ELSE customers.name 
    END,
    -- Update created_at to first call date
    created_at = t.first_call_date,
    -- Update last_visit to last call date
    last_visit = t.last_call_date,
    -- Add call statistics (you may need to add these columns first)
    -- total_calls = t.total_calls,
    -- total_call_duration = t.total_duration_minutes,
    -- loyalty_level = t.loyalty_level,
    updated_at = NOW()
FROM temp_call_log t
WHERE customers.phone = t.phone;

-- Step 5: Show customers that were updated
SELECT 
    'Updated customers from call log:' as info,
    COUNT(*) as customers_updated
FROM customers c
JOIN temp_call_log t ON c.phone = t.phone
WHERE c.updated_at > NOW() - INTERVAL '1 minute';

-- Step 6: Show sample of updated customers
SELECT 
    'Sample of updated customers:' as info,
    c.id,
    c.name,
    c.phone,
    c.created_at,
    c.last_visit,
    t.total_calls,
    t.total_duration_minutes,
    t.loyalty_level
FROM customers c
JOIN temp_call_log t ON c.phone = t.phone
WHERE c.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY t.total_calls DESC
LIMIT 10;

-- Step 7: Show customers in call log but not in database (potential new customers)
SELECT 
    'Potential new customers from call log:' as info,
    t.phone,
    t.best_name,
    t.first_call_date,
    t.total_calls,
    t.loyalty_level
FROM temp_call_log t
LEFT JOIN customers c ON t.phone = c.phone
WHERE c.phone IS NULL
ORDER BY t.total_calls DESC
LIMIT 20;

-- Step 8: Show loyalty level distribution
SELECT 
    'Loyalty level distribution:' as info,
    t.loyalty_level,
    COUNT(*) as customer_count,
    ROUND(AVG(t.total_calls), 1) as avg_calls,
    ROUND(AVG(t.total_duration_minutes), 1) as avg_duration_minutes
FROM temp_call_log t
JOIN customers c ON t.phone = c.phone
GROUP BY t.loyalty_level
ORDER BY 
    CASE t.loyalty_level 
        WHEN 'VIP' THEN 1 
        WHEN 'Gold' THEN 2 
        WHEN 'Silver' THEN 3 
        WHEN 'Bronze' THEN 4 
        WHEN 'Basic' THEN 5 
    END;
