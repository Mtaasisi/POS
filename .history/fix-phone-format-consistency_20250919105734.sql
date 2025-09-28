-- Fix phone number format consistency - ensure all start with +255
-- This will standardize any remaining phone numbers that don't have the + prefix

-- Show current phone format inconsistencies
SELECT 
    'Phone format inconsistencies:' as info,
    phone,
    COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL 
    AND phone != ''
    AND phone NOT LIKE '+255%'
GROUP BY phone
ORDER BY count DESC;

-- Update phone numbers to ensure they all start with +255
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

-- Show results
SELECT 
    'Phone format fix completed:' as info,
    COUNT(*) as phones_updated
FROM customers 
WHERE phone LIKE '+255%';

-- Show sample of corrected phone numbers
SELECT 
    'Sample of corrected phone numbers:' as info,
    id,
    name,
    phone,
    city,
    updated_at
FROM customers 
WHERE phone LIKE '+255%'
ORDER BY updated_at DESC
LIMIT 10;
