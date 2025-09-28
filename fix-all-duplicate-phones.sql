-- Comprehensive fix for all duplicate phone numbers
-- This will resolve all "duplicate key value violates unique constraint" errors

-- Step 1: Show all duplicate phone numbers before fixing
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
CREATE TEMP TABLE customers_backup AS
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
CREATE TEMP TABLE phone_ranking AS
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
FROM phone_ranking 
WHERE phone_rank > 1;

-- Update duplicate phone numbers
UPDATE customers 
SET 
  phone = CASE 
    WHEN pr.phone_rank = 2 THEN CONCAT(customers.phone, '_2')
    WHEN pr.phone_rank = 3 THEN CONCAT(customers.phone, '_3')
    WHEN pr.phone_rank = 4 THEN CONCAT(customers.phone, '_4')
    WHEN pr.phone_rank = 5 THEN CONCAT(customers.phone, '_5')
    ELSE CONCAT(customers.phone, '_', pr.phone_rank)
  END,
  updated_at = NOW()
FROM phone_ranking pr
WHERE customers.id = pr.id 
  AND pr.phone_rank > 1;

-- Step 4: Verify the fix
SELECT 
  'AFTER FIX - Duplicate phone numbers' as status,
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

-- Step 7: Final verification
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

