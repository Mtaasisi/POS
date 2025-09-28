-- Fix phone constraint issues that might cause missing customers

-- Step 1: First, let's see what we're dealing with
-- Run the check-phone-constraint-issues.sql first to see the problems

-- Step 2: Fix duplicate phone numbers by making them unique
-- This will add a suffix to duplicate phone numbers to make them unique

-- Create a temporary table to hold the fixes
CREATE TEMP TABLE phone_fixes AS
SELECT 
  id,
  name,
  phone,
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

-- Update duplicate phone numbers (keep the first one, modify the rest)
UPDATE customers 
SET phone = CONCAT(customers.phone, '_', pf.phone_rank)
FROM phone_fixes pf
WHERE customers.id = pf.id 
  AND pf.phone_rank > 1;

-- Step 3: Fix customers with null or empty phone numbers
-- Generate unique phone numbers for customers without phones
UPDATE customers 
SET phone = CONCAT('NO_PHONE_', id::text)
WHERE phone IS NULL OR phone = '';

-- Step 4: Clean up invalid phone formats
-- Remove non-numeric characters except + at the beginning
UPDATE customers 
SET phone = REGEXP_REPLACE(phone, '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL 
  AND phone != ''
  AND phone !~ '^[0-9+\-\s\(\)]+$';

-- Step 5: Ensure phone numbers are properly formatted
-- Add +255 prefix for Tanzanian numbers that don't have it
UPDATE customers 
SET phone = CASE 
  WHEN phone ~ '^0[0-9]{9}$' THEN CONCAT('+255', SUBSTRING(phone, 2))
  WHEN phone ~ '^[0-9]{9}$' THEN CONCAT('+255', phone)
  WHEN phone ~ '^255[0-9]{9}$' THEN CONCAT('+', phone)
  ELSE phone
END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND phone ~ '^[0-9+]+$'
  AND LENGTH(phone) BETWEEN 9 AND 15;

-- Step 6: Verify the fixes
SELECT 
  'After fixes - duplicate phones' as check_type,
  COUNT(*) as count
FROM (
  SELECT phone, COUNT(*) 
  FROM customers 
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone 
  HAVING COUNT(*) > 1
) duplicates;

SELECT 
  'After fixes - null phones' as check_type,
  COUNT(*) as count
FROM customers 
WHERE phone IS NULL OR phone = '';

SELECT 
  'After fixes - invalid formats' as check_type,
  COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    phone !~ '^[0-9+\-\s\(\)]+$'
    OR LENGTH(phone) < 9
    OR LENGTH(phone) > 15
  );

-- Step 7: Show sample of fixed customers
SELECT 
  id,
  name,
  phone,
  email,
  created_at
FROM customers 
ORDER BY updated_at DESC
LIMIT 10;
