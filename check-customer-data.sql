-- Check customer data integrity and visibility issues

-- 1. Count total customers
SELECT COUNT(*) as total_customers FROM customers;

-- 2. Check for customers with null or empty names
SELECT 
  COUNT(*) as customers_with_null_names,
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as null_names,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as valid_names
FROM customers;

-- 3. Check for customers with null or empty phones
SELECT 
  COUNT(*) as customers_with_null_phones,
  COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as null_phones,
  COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as valid_phones
FROM customers;

-- 4. Sample of recent customers
SELECT 
  id, 
  name, 
  phone, 
  email, 
  city,
  created_at,
  is_active
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check for customers with missing critical data
SELECT 
  id, 
  name, 
  phone, 
  email,
  created_at
FROM customers 
WHERE name IS NULL OR name = '' OR phone IS NULL OR phone = ''
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check for duplicate customers (same name and phone)
SELECT 
  name, 
  phone, 
  COUNT(*) as duplicate_count
FROM customers 
WHERE name IS NOT NULL AND phone IS NOT NULL
GROUP BY name, phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 7. Check customers by creation date (last 30 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as customers_created
FROM customers 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 8. Check for customers with special characters in names
SELECT 
  id, 
  name, 
  phone,
  created_at
FROM customers 
WHERE name ~ '[^a-zA-Z0-9\s\-\.]'
ORDER BY created_at DESC
LIMIT 10;

-- 9. Check RLS policies on customers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- 10. Check if there are any constraints that might affect data
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass;
