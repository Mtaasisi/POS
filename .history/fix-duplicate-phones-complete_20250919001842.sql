-- Complete fix for duplicate phone numbers causing missing customers
-- This will resolve the constraint violation and make all customers visible

-- Step 1: Show current duplicate phone numbers
SELECT 
  'BEFORE FIX - Duplicate phone numbers' as status,
  phone,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(name, ', ') as customer_names
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Create a backup of customers with duplicate phones
CREATE TEMP TABLE customers_duplicate_phones_backup AS
SELECT *
FROM customers 
WHERE phone IN (
  SELECT phone 
  FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone 
  HAVING COUNT(*) > 1
);

-- Step 3: Fix duplicate phone numbers systematically
-- For each duplicate phone, keep the first customer (oldest) and modify the rest

-- Create a temporary table with ranking
CREATE TEMP TABLE phone_duplicates_ranking AS
SELECT 
  id,
  name,
  phone,
  email,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at, id) as phone_rank
FROM customers 
WHERE phone IS NOT NULL 
  AND phone != ''
  AND phone IN (
    SELECT phone 
    FROM customers 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
  );

-- Show what will be changed
SELECT 
  'Customers that will be modified' as action,
  COUNT(*) as count
FROM phone_duplicates_ranking 
WHERE phone_rank > 1;

-- Update duplicate phone numbers
UPDATE customers 
SET 
  phone = CASE 
    WHEN pdr.phone_rank = 2 THEN CONCAT(customers.phone, '_2')
    WHEN pdr.phone_rank = 3 THEN CONCAT(customers.phone, '_3')
    WHEN pdr.phone_rank = 4 THEN CONCAT(customers.phone, '_4')
    WHEN pdr.phone_rank = 5 THEN CONCAT(customers.phone, '_5')
    WHEN pdr.phone_rank = 6 THEN CONCAT(customers.phone, '_6')
    WHEN pdr.phone_rank = 7 THEN CONCAT(customers.phone, '_7')
    WHEN pdr.phone_rank = 8 THEN CONCAT(customers.phone, '_8')
    WHEN pdr.phone_rank = 9 THEN CONCAT(customers.phone, '_9')
    ELSE CONCAT(customers.phone, '_', pdr.phone_rank)
  END,
  updated_at = NOW()
FROM phone_duplicates_ranking pdr
WHERE customers.id = pdr.id 
  AND pdr.phone_rank > 1;

-- Step 4: Verify the fix
SELECT 
  'AFTER FIX - Duplicate phone numbers remaining' as status,
  COUNT(*) as count
FROM (
  SELECT phone, COUNT(*) 
  FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone 
  HAVING COUNT(*) > 1
) duplicates;

-- Step 5: Show the specific phone number that was causing the error
SELECT 
  'Fixed phone number +255764421463' as status,
  id,
  name,
  phone,
  email,
  created_at,
  updated_at
FROM customers 
WHERE phone LIKE '+255764421463%'
ORDER BY created_at;

-- Step 6: Show all customers with modified phone numbers
SELECT 
  'All customers with modified phone numbers' as status,
  id,
  name,
  phone,
  email,
  created_at,
  updated_at
FROM customers 
WHERE phone LIKE '%_2' 
   OR phone LIKE '%_3' 
   OR phone LIKE '%_4' 
   OR phone LIKE '%_5'
   OR phone LIKE '%_6'
   OR phone LIKE '%_7'
   OR phone LIKE '%_8'
   OR phone LIKE '%_9'
ORDER BY phone, created_at;

-- Step 7: Final verification - check total customers
SELECT 
  'FINAL VERIFICATION' as status,
  'Total customers' as metric,
  COUNT(*) as count
FROM customers;

SELECT 
  'FINAL VERIFICATION' as status,
  'Customers with unique phones' as metric,
  COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL AND phone != '';

SELECT 
  'FINAL VERIFICATION' as status,
  'Customers with null/empty phones' as metric,
  COUNT(*) as count
FROM customers 
WHERE phone IS NULL OR phone = '';

-- Step 8: Test that the constraint is now satisfied
-- This should return 0 if the constraint is satisfied
SELECT 
  'CONSTRAINT TEST' as status,
  'Customers that would violate phone constraint' as metric,
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

-- Step 9: Show sample of all customers to verify they're accessible
SELECT 
  'SAMPLE CUSTOMERS AFTER FIX' as status,
  id,
  name,
  phone,
  email,
  is_active,
  created_at
FROM customers 
ORDER BY created_at DESC
LIMIT 15;

-- Step 10: Check for any other potential issues
SELECT 
  'CUSTOMERS WITH MISSING NAMES' as issue,
  COUNT(*) as count
FROM customers 
WHERE name IS NULL OR name = '';

SELECT 
  'CUSTOMERS WITH is_active = false' as issue,
  COUNT(*) as count
FROM customers 
WHERE is_active = false;

SELECT 
  'CUSTOMERS WITH is_active = null' as issue,
  COUNT(*) as count
FROM customers 
WHERE is_active IS NULL;

