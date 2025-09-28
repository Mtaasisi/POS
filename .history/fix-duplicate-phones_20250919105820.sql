-- Fix duplicate phone numbers before updating format
-- This script identifies and resolves duplicate phone numbers

-- First, let's see what duplicate phone numbers exist
SELECT 
    'Duplicate phone numbers in database:' as info,
    phone,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as customer_ids,
    STRING_AGG(name, ', ') as customer_names
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show details of customers with duplicate phones
SELECT 
    'Details of customers with duplicate phones:' as info,
    c.id,
    c.name,
    c.phone,
    c.city,
    c.created_at,
    c.updated_at
FROM customers c
WHERE c.phone IN (
    SELECT phone 
    FROM customers 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
)
ORDER BY c.phone, c.created_at;

-- Strategy: For duplicate phones, keep the most recent/complete record and merge data
-- First, let's create a backup of what we're about to change
CREATE TEMP TABLE duplicate_phone_backup AS
SELECT * FROM customers 
WHERE phone IN (
    SELECT phone 
    FROM customers 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
);

-- Show backup created
SELECT 
    'Backup created for duplicate phone customers:' as info,
    COUNT(*) as backed_up_customers
FROM duplicate_phone_backup;

-- Now merge duplicate phone numbers by keeping the best record for each phone
-- We'll delete duplicates and keep the one with the most complete data
WITH ranked_customers AS (
    SELECT 
        id,
        name,
        phone,
        city,
        created_at,
        updated_at,
        -- Rank by data completeness and recency
        ROW_NUMBER() OVER (
            PARTITION BY phone 
            ORDER BY 
                CASE WHEN name IS NOT NULL AND name != '' AND name != '__' THEN 1 ELSE 2 END,
                CASE WHEN city IS NOT NULL AND city != '' THEN 1 ELSE 2 END,
                updated_at DESC,
                created_at DESC
        ) as rn
    FROM customers 
    WHERE phone IN (
        SELECT phone 
        FROM customers 
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY phone 
        HAVING COUNT(*) > 1
    )
)
DELETE FROM customers 
WHERE id IN (
    SELECT id 
    FROM ranked_customers 
    WHERE rn > 1
);

-- Show how many duplicates were removed
SELECT 
    'Duplicate customers removed:' as info,
    COUNT(*) as removed_count
FROM duplicate_phone_backup
WHERE id NOT IN (SELECT id FROM customers);

-- Now we can safely update phone formats
UPDATE customers 
SET 
    phone = CASE 
        WHEN phone LIKE '255%' THEN '+' || phone
        WHEN phone LIKE '+255%' THEN phone  -- Already correct
        WHEN LENGTH(phone) = 9 THEN '+255' || phone
        ELSE '+255' || phone
    END,
    updated_at = NOW()
WHERE phone IS NOT NULL 
    AND phone != ''
    AND phone NOT LIKE '+255%';

-- Show final results
SELECT 
    'Phone format fix completed after duplicate removal:' as info,
    COUNT(*) as phones_updated
FROM customers 
WHERE phone LIKE '+255%';

-- Show sample of final results
SELECT 
    'Sample of final customer data:' as info,
    id,
    name,
    phone,
    city,
    updated_at
FROM customers 
WHERE phone LIKE '+255%'
ORDER BY updated_at DESC
LIMIT 10;

-- Show any remaining issues
SELECT 
    'Remaining phone format issues:' as info,
    phone,
    COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL 
    AND phone != ''
    AND phone NOT LIKE '+255%'
GROUP BY phone
ORDER BY count DESC;

-- Clean up
DROP TABLE duplicate_phone_backup;
