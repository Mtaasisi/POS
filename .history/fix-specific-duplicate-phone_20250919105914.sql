-- Fix the specific duplicate phone number issue
-- This script handles the +255746605561 duplicate specifically

-- First, let's see exactly what's happening with this phone number
SELECT 
    'Current records with phone +255746605561:' as info,
    id,
    name,
    phone,
    city,
    created_at,
    updated_at
FROM customers 
WHERE phone = '+255746605561' OR phone = '255746605561'
ORDER BY created_at;

-- Let's also check what records have the phone without the + prefix
SELECT 
    'Records with phone 255746605561 (no +):' as info,
    id,
    name,
    phone,
    city,
    created_at,
    updated_at
FROM customers 
WHERE phone = '255746605561'
ORDER BY created_at;

-- Strategy: Update the record without + to have a different phone number
-- or merge the data if they're the same customer

-- Check if these are the same customer (same name)
SELECT 
    'Are these the same customer?' as info,
    COUNT(DISTINCT name) as unique_names,
    STRING_AGG(DISTINCT name, ', ') as all_names
FROM customers 
WHERE phone IN ('+255746605561', '255746605561');

-- If they have different names, we need to decide which one to keep
-- Let's see the full details
SELECT 
    'Full details of conflicting records:' as info,
    id,
    name,
    phone,
    city,
    created_at,
    updated_at,
    CASE 
        WHEN phone = '+255746605561' THEN 'Has + prefix'
        WHEN phone = '255746605561' THEN 'Missing + prefix'
        ELSE 'Other format'
    END as phone_status
FROM customers 
WHERE phone IN ('+255746605561', '255746605561')
ORDER BY created_at;

-- Solution: Update the record without + to have the + prefix
-- But first, let's make sure we're not creating a duplicate
-- We'll update the record that doesn't have the + prefix

UPDATE customers 
SET 
    phone = '+255746605561',
    updated_at = NOW()
WHERE phone = '255746605561'
    AND id NOT IN (
        SELECT id FROM customers WHERE phone = '+255746605561'
    );

-- If the above doesn't work (because of the constraint), 
-- we need to delete one of the duplicates first
-- Let's try a different approach - delete the duplicate and keep the better one

-- First, let's see which record is better (more complete data)
WITH customer_comparison AS (
    SELECT 
        id,
        name,
        phone,
        city,
        created_at,
        updated_at,
        -- Score based on data completeness
        CASE WHEN name IS NOT NULL AND name != '' AND name != '__' THEN 1 ELSE 0 END +
        CASE WHEN city IS NOT NULL AND city != '' THEN 1 ELSE 0 END +
        CASE WHEN phone LIKE '+255%' THEN 1 ELSE 0 END as completeness_score
    FROM customers 
    WHERE phone IN ('+255746605561', '255746605561')
)
SELECT 
    'Customer comparison for phone 255746605561:' as info,
    id,
    name,
    phone,
    city,
    completeness_score,
    created_at
FROM customer_comparison
ORDER BY completeness_score DESC, created_at DESC;

-- Now let's delete the duplicate with lower score
-- (This will be the record without + prefix if it has less complete data)
DELETE FROM customers 
WHERE id IN (
    WITH customer_comparison AS (
        SELECT 
            id,
            name,
            phone,
            city,
            created_at,
            updated_at,
            -- Score based on data completeness
            CASE WHEN name IS NOT NULL AND name != '' AND name != '__' THEN 1 ELSE 0 END +
            CASE WHEN city IS NOT NULL AND city != '' THEN 1 ELSE 0 END +
            CASE WHEN phone LIKE '+255%' THEN 1 ELSE 0 END as completeness_score,
            ROW_NUMBER() OVER (ORDER BY 
                CASE WHEN name IS NOT NULL AND name != '' AND name != '__' THEN 1 ELSE 0 END +
                CASE WHEN city IS NOT NULL AND city != '' THEN 1 ELSE 0 END +
                CASE WHEN phone LIKE '+255%' THEN 1 ELSE 0 END DESC,
                created_at DESC
            ) as rn
        FROM customers 
        WHERE phone IN ('+255746605561', '255746605561')
    )
    SELECT id FROM customer_comparison WHERE rn > 1
);

-- Now let's verify the fix worked
SELECT 
    'After duplicate removal - remaining record:' as info,
    id,
    name,
    phone,
    city,
    created_at,
    updated_at
FROM customers 
WHERE phone IN ('+255746605561', '255746605561');

-- Now we can safely update any remaining phone numbers to +255 format
UPDATE customers 
SET 
    phone = CASE 
        WHEN phone LIKE '255%' AND phone NOT LIKE '+255%' THEN '+' || phone
        ELSE phone
    END,
    updated_at = NOW()
WHERE phone LIKE '255%' AND phone NOT LIKE '+255%';

-- Final verification
SELECT 
    'Final phone format check:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN phone LIKE '+255%' THEN 1 END) as proper_format,
    COUNT(CASE WHEN phone LIKE '255%' AND phone NOT LIKE '+255%' THEN 1 END) as missing_plus
FROM customers 
WHERE phone IS NOT NULL AND phone != '';
