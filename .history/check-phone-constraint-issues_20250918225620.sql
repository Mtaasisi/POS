-- Check for phone constraint issues that might cause missing customers

-- 1. Check for duplicate phone numbers (this would violate the unique constraint)
SELECT 
  phone, 
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(name, ', ') as customer_names
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Check for customers with null phone numbers
SELECT 
  COUNT(*) as customers_with_null_phones,
  COUNT(CASE WHEN phone IS NULL THEN 1 END) as null_phones,
  COUNT(CASE WHEN phone = '' THEN 1 END) as empty_phones
FROM customers;

-- 3. Check for customers with invalid phone formats
SELECT 
  id,
  name,
  phone,
  created_at
FROM customers 
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    phone !~ '^[0-9+\-\s\(\)]+$'  -- Contains non-phone characters
    OR LENGTH(phone) < 9          -- Too short
    OR LENGTH(phone) > 15         -- Too long
  )
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check for customers that might be hidden due to constraint violations
SELECT 
  'Potential constraint violations' as issue_type,
  COUNT(*) as count
FROM customers 
WHERE (
  phone IS NULL 
  OR phone = ''
  OR phone IN (
    SELECT phone 
    FROM customers 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
  )
);

-- 5. Sample of customers with problematic phone numbers
SELECT 
  id,
  name,
  phone,
  email,
  created_at,
  CASE 
    WHEN phone IS NULL THEN 'NULL phone'
    WHEN phone = '' THEN 'Empty phone'
    WHEN phone !~ '^[0-9+\-\s\(\)]+$' THEN 'Invalid format'
    WHEN LENGTH(phone) < 9 THEN 'Too short'
    WHEN LENGTH(phone) > 15 THEN 'Too long'
    ELSE 'Valid'
  END as phone_status
FROM customers 
WHERE phone IS NULL 
   OR phone = ''
   OR phone !~ '^[0-9+\-\s\(\)]+$'
   OR LENGTH(phone) < 9
   OR LENGTH(phone) > 15
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check if there are any customers that can't be inserted due to constraints
-- This would help identify if the constraint is preventing customer creation
SELECT 
  'Customers that would violate phone constraint' as issue,
  COUNT(*) as count
FROM customers c1
WHERE EXISTS (
  SELECT 1 
  FROM customers c2 
  WHERE c2.phone = c1.phone 
    AND c2.id != c1.id
    AND c1.phone IS NOT NULL 
    AND c1.phone != ''
);
