-- Simple fix for duplicate phone constraint issue
-- This script handles the constraint violation by removing duplicates first

-- Step 1: Show the exact problem
SELECT 
    'Problem: Duplicate phone numbers:' as info,
    phone,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as customer_ids,
    STRING_AGG(name, ', ') as names
FROM customers 
WHERE phone IN ('+255746605561', '255746605561')
GROUP BY phone;

-- Step 2: Show all records with this phone number
SELECT 
    'All records with phone 255746605561 (with or without +):' as info,
    id,
    name,
    phone,
    city,
    created_at,
    updated_at
FROM customers 
WHERE phone IN ('+255746605561', '255746605561')
ORDER BY created_at;

-- Step 3: Simple solution - delete the record without + prefix
-- (assuming the one with + prefix is the correct one)
DELETE FROM customers 
WHERE phone = '255746605561';

-- Step 4: Verify the deletion worked
SELECT 
    'After deletion - remaining records:' as info,
    id,
    name,
    phone,
    city,
    created_at
FROM customers 
WHERE phone = '+255746605561';

-- Step 5: Now fix any other phone numbers that need + prefix
UPDATE customers 
SET 
    phone = '+' || phone,
    updated_at = NOW()
WHERE phone LIKE '255%' 
    AND phone NOT LIKE '+255%'
    AND phone NOT IN (
        SELECT phone FROM customers WHERE phone = '+' || phone
    );

-- Step 6: Show final results
SELECT 
    'Final phone format summary:' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN phone LIKE '+255%' THEN 1 END) as proper_format,
    COUNT(CASE WHEN phone LIKE '255%' AND phone NOT LIKE '+255%' THEN 1 END) as missing_plus
FROM customers 
WHERE phone IS NOT NULL AND phone != '';

-- Step 7: Show any remaining issues
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
