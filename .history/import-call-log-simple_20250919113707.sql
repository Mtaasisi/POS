-- Import Call Log Data - Simple Version
-- This script uses the pre-processed data from the Python script

-- Step 1: First, add the required columns if they don't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_call_duration_minutes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS incoming_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS outgoing_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missed_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_call_duration_minutes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_call_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_call_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_loyalty_level VARCHAR(20) DEFAULT 'Basic';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_call_loyalty_level ON customers(call_loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_total_calls ON customers(total_calls);
CREATE INDEX IF NOT EXISTS idx_customers_last_call_date ON customers(last_call_date);

-- Step 3: Show current customer count
SELECT 
    'Current customer count:' as info,
    COUNT(*) as total_customers
FROM customers;

-- Step 4: Import the call log data (you'll need to run the generated SQL file)
-- The file 'import-call-log-generated.sql' contains the actual data
-- Run that file first, then continue with the rest of this script

-- Step 5: Show analysis after import
SELECT 
    'Call Log Analysis after import:' as info,
    COUNT(*) as customers_with_call_data
FROM customers
WHERE total_calls > 0;

-- Step 6: Show loyalty level distribution
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

-- Step 7: Show top customers by call activity
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

-- Step 8: Show customers with updated names
SELECT 
    'Customers with updated names from call log:' as info,
    COUNT(*) as customers_with_better_names
FROM customers
WHERE name != '__' 
    AND name IS NOT NULL 
    AND total_calls > 0;

-- Step 9: Show sample of updated customers
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
