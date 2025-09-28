-- Advanced debugging for missing customers (phone constraint is not the issue)

-- 1. Check total customer count vs what the app sees
SELECT 
  'Total customers in database' as metric,
  COUNT(*) as count
FROM customers;

-- 2. Check customers by creation date to see if there's a pattern
SELECT 
  DATE(created_at) as date,
  COUNT(*) as customers_created
FROM customers 
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- 3. Check for customers with different data quality issues
SELECT 
  'Customers with valid names' as metric,
  COUNT(*) as count
FROM customers 
WHERE name IS NOT NULL AND name != '' AND name != 'Unknown Customer';

SELECT 
  'Customers with valid phones' as metric,
  COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL AND phone != '' AND phone NOT LIKE 'NO_PHONE_%';

SELECT 
  'Customers with valid emails' as metric,
  COUNT(*) as count
FROM customers 
WHERE email IS NOT NULL AND email != '';

-- 4. Check for customers that might be filtered out by the app
SELECT 
  'Customers with is_active = false' as metric,
  COUNT(*) as count
FROM customers 
WHERE is_active = false;

SELECT 
  'Customers with is_active = true' as metric,
  COUNT(*) as count
FROM customers 
WHERE is_active = true;

SELECT 
  'Customers with is_active = null' as metric,
  COUNT(*) as count
FROM customers 
WHERE is_active IS NULL;

-- 5. Check for customers with special characters or encoding issues
SELECT 
  'Customers with special characters in names' as metric,
  COUNT(*) as count
FROM customers 
WHERE name ~ '[^\x00-\x7F]' OR name ~ '[^\w\s\-\.]';

-- 6. Check for customers created by different users
SELECT 
  created_by,
  COUNT(*) as customer_count
FROM customers 
GROUP BY created_by
ORDER BY customer_count DESC;

-- 7. Check for customers with very long or very short names
SELECT 
  'Customers with very short names (1-2 chars)' as metric,
  COUNT(*) as count
FROM customers 
WHERE LENGTH(name) <= 2;

SELECT 
  'Customers with very long names (100+ chars)' as metric,
  COUNT(*) as count
FROM customers 
WHERE LENGTH(name) > 100;

-- 8. Check for customers with unusual data patterns
SELECT 
  'Customers with same name and phone' as metric,
  COUNT(*) as count
FROM customers 
WHERE name = phone;

-- 9. Check for customers with null IDs (shouldn't happen but worth checking)
SELECT 
  'Customers with null IDs' as metric,
  COUNT(*) as count
FROM customers 
WHERE id IS NULL;

-- 10. Sample of recent customers to see what the data looks like
SELECT 
  id,
  name,
  phone,
  email,
  city,
  is_active,
  created_at,
  created_by
FROM customers 
ORDER BY created_at DESC
LIMIT 20;

-- 11. Check for customers that might be in a different state
SELECT 
  'Customers created in last 7 days' as metric,
  COUNT(*) as count
FROM customers 
WHERE created_at >= NOW() - INTERVAL '7 days';

SELECT 
  'Customers created in last 30 days' as metric,
  COUNT(*) as count
FROM customers 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 12. Check for any RLS policy issues by testing different select patterns
-- This will help identify if RLS is filtering out customers
SELECT 
  'Simple select count' as test_type,
  COUNT(*) as count
FROM customers;

SELECT 
  'Select with specific fields count' as test_type,
  COUNT(*) as count
FROM (
  SELECT id, name, phone, email, created_at
  FROM customers
) simple_select;

-- 13. Check for customers that might be in a different schema or table
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name LIKE '%customer%'
ORDER BY table_schema, table_name;
