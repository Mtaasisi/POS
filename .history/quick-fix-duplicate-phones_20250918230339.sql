-- Quick and safe fix for duplicate phone numbers
-- This will fix the immediate issue without affecting other data

-- Step 1: See the current duplicate phone numbers
SELECT 
  phone,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Fix the specific phone number causing the error (+255764421463)
-- Keep the first customer, modify the second one
UPDATE customers 
SET 
  phone = '+255764421463_2',
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM customers 
  WHERE phone = '+255764421463' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 3: Fix any other duplicate phone numbers
-- This will handle all duplicates systematically
WITH phone_duplicates AS (
  SELECT 
    id,
    phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at) as rn
  FROM customers 
  WHERE phone IN (
    SELECT phone 
    FROM customers 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
  )
)
UPDATE customers 
SET 
  phone = CONCAT(customers.phone, '_', pd.rn),
  updated_at = NOW()
FROM phone_duplicates pd
WHERE customers.id = pd.id 
  AND pd.rn > 1;

-- Step 4: Verify the fix worked
SELECT 
  'Verification - duplicate phones remaining' as check,
  COUNT(*) as count
FROM (
  SELECT phone, COUNT(*) 
  FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone 
  HAVING COUNT(*) > 1
) duplicates;

-- Step 5: Show the fixed phone number
SELECT 
  'Fixed phone number' as status,
  id,
  name,
  phone,
  email,
  created_at
FROM customers 
WHERE phone LIKE '+255764421463%'
ORDER BY created_at;

-- Step 6: Show total customers to ensure none were lost
SELECT 
  'Total customers' as metric,
  COUNT(*) as count
FROM customers;
