-- Fix duplicate phone numbers that are causing constraint violations
-- This will resolve the "duplicate key value violates unique constraint" error

-- Step 1: Identify all duplicate phone numbers
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

-- Step 2: Show the specific duplicate that's causing the error
SELECT 
  id,
  name,
  phone,
  email,
  created_at,
  updated_at
FROM customers 
WHERE phone = '+255764421463'
ORDER BY created_at;

-- Step 3: Fix duplicate phone numbers by making them unique
-- Keep the first customer (oldest) with the original phone, modify the rest

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE phone_duplicates AS
SELECT 
  id,
  name,
  phone,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at) as phone_rank
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
FROM phone_duplicates 
WHERE phone_rank > 1;

-- Update duplicate phone numbers (keep the first one, modify the rest)
UPDATE customers 
SET 
  phone = CONCAT(customers.phone, '_', pd.phone_rank),
  updated_at = NOW()
FROM phone_duplicates pd
WHERE customers.id = pd.id 
  AND pd.phone_rank > 1;

-- Step 4: Verify the fix
SELECT 
  'After fix - duplicate phones' as check_type,
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
  id,
  name,
  phone,
  email,
  created_at,
  updated_at
FROM customers 
WHERE phone LIKE '+255764421463%'
ORDER BY created_at;

-- Step 6: Show sample of all customers to verify they're all accessible
SELECT 
  id,
  name,
  phone,
  email,
  created_at
FROM customers 
ORDER BY created_at DESC
LIMIT 10;

-- Step 7: Count total customers to ensure none were lost
SELECT 
  'Total customers after fix' as metric,
  COUNT(*) as count
FROM customers;
