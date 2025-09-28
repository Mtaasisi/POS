-- Comprehensive diagnostic for all customer-related tables
-- This will help identify why some customers might not be showing up

-- 1. Check main customers table
SELECT 
  'MAIN CUSTOMERS TABLE' as table_name,
  COUNT(*) as total_customers,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as with_names,
  COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phones,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as with_emails,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_customers,
  COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_active_customers
FROM customers;

-- 2. Check for duplicate phone numbers in main table
SELECT 
  'DUPLICATE PHONE NUMBERS' as issue,
  phone,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(name, ', ') as customer_names
FROM customers 
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 3. Check customer_checkins table
SELECT 
  'CUSTOMER CHECKINS' as table_name,
  COUNT(*) as total_checkins,
  COUNT(DISTINCT customer_id) as unique_customers_with_checkins
FROM customer_checkins;

-- 4. Check customer_communications table
SELECT 
  'CUSTOMER COMMUNICATIONS' as table_name,
  COUNT(*) as total_communications,
  COUNT(DISTINCT customer_id) as unique_customers_with_communications
FROM customer_communications;

-- 5. Check customer_notes table
SELECT 
  'CUSTOMER NOTES' as table_name,
  COUNT(*) as total_notes,
  COUNT(DISTINCT customer_id) as unique_customers_with_notes
FROM customer_notes;

-- 6. Check customer_payments table
SELECT 
  'CUSTOMER PAYMENTS' as table_name,
  COUNT(*) as total_payments,
  COUNT(DISTINCT customer_id) as unique_customers_with_payments
FROM customer_payments;

-- 7. Check customer_preferences table
SELECT 
  'CUSTOMER PREFERENCES' as table_name,
  COUNT(*) as total_preferences,
  COUNT(DISTINCT customer_id) as unique_customers_with_preferences
FROM customer_preferences;

-- 8. Check customer_revenue table
SELECT 
  'CUSTOMER REVENUE' as table_name,
  COUNT(*) as total_revenue_records,
  COUNT(DISTINCT customer_id) as unique_customers_with_revenue
FROM customer_revenue;

-- 9. Check loyalty_customers table
SELECT 
  'LOYALTY CUSTOMERS' as table_name,
  COUNT(*) as total_loyalty_customers,
  COUNT(DISTINCT customer_id) as unique_customers_in_loyalty
FROM loyalty_customers;

-- 10. Check lats_pos_loyalty_customer_settings table
SELECT 
  'LATS POS LOYALTY SETTINGS' as table_name,
  COUNT(*) as total_settings,
  COUNT(DISTINCT customer_id) as unique_customers_with_settings
FROM lats_pos_loyalty_customer_settings;

-- 11. Check for customers that exist in main table but not in related tables
SELECT 
  'CUSTOMERS NOT IN CHECKINS' as issue,
  COUNT(*) as count
FROM customers c
LEFT JOIN customer_checkins cc ON c.id = cc.customer_id
WHERE cc.customer_id IS NULL;

SELECT 
  'CUSTOMERS NOT IN COMMUNICATIONS' as issue,
  COUNT(*) as count
FROM customers c
LEFT JOIN customer_communications cc ON c.id = cc.customer_id
WHERE cc.customer_id IS NULL;

SELECT 
  'CUSTOMERS NOT IN NOTES' as issue,
  COUNT(*) as count
FROM customers c
LEFT JOIN customer_notes cn ON c.id = cn.customer_id
WHERE cn.customer_id IS NULL;

SELECT 
  'CUSTOMERS NOT IN PAYMENTS' as issue,
  COUNT(*) as count
FROM customers c
LEFT JOIN customer_payments cp ON c.id = cp.customer_id
WHERE cp.customer_id IS NULL;

-- 12. Check for customers with missing critical data
SELECT 
  'CUSTOMERS WITH MISSING NAMES' as issue,
  COUNT(*) as count
FROM customers 
WHERE name IS NULL OR name = '';

SELECT 
  'CUSTOMERS WITH MISSING PHONES' as issue,
  COUNT(*) as count
FROM customers 
WHERE phone IS NULL OR phone = '';

SELECT 
  'CUSTOMERS WITH MISSING EMAILS' as issue,
  COUNT(*) as count
FROM customers 
WHERE email IS NULL OR email = '';

-- 13. Check for customers with invalid data formats
SELECT 
  'CUSTOMERS WITH INVALID PHONE FORMATS' as issue,
  COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    phone !~ '^[0-9+\-\s\(\)]+$'
    OR LENGTH(phone) < 9
    OR LENGTH(phone) > 15
  );

-- 14. Check for customers created recently vs old customers
SELECT 
  'CUSTOMERS CREATED IN LAST 7 DAYS' as period,
  COUNT(*) as count
FROM customers 
WHERE created_at >= NOW() - INTERVAL '7 days';

SELECT 
  'CUSTOMERS CREATED IN LAST 30 DAYS' as period,
  COUNT(*) as count
FROM customers 
WHERE created_at >= NOW() - INTERVAL '30 days';

SELECT 
  'CUSTOMERS CREATED MORE THAN 30 DAYS AGO' as period,
  COUNT(*) as count
FROM customers 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 15. Check for customers with unusual data patterns
SELECT 
  'CUSTOMERS WITH SAME NAME AND PHONE' as issue,
  COUNT(*) as count
FROM customers 
WHERE name = phone;

SELECT 
  'CUSTOMERS WITH VERY SHORT NAMES' as issue,
  COUNT(*) as count
FROM customers 
WHERE LENGTH(name) <= 2;

SELECT 
  'CUSTOMERS WITH VERY LONG NAMES' as issue,
  COUNT(*) as count
FROM customers 
WHERE LENGTH(name) > 100;

-- 16. Sample of recent customers to see data quality
SELECT 
  'SAMPLE RECENT CUSTOMERS' as info,
  id,
  name,
  phone,
  email,
  is_active,
  created_at
FROM customers 
ORDER BY created_at DESC
LIMIT 10;

-- 17. Check for any RLS policy issues by testing different access patterns
SELECT 
  'RLS TEST - SIMPLE SELECT' as test,
  COUNT(*) as count
FROM customers;

SELECT 
  'RLS TEST - SELECT WITH SPECIFIC FIELDS' as test,
  COUNT(*) as count
FROM (
  SELECT id, name, phone, email, created_at
  FROM customers
) simple_select;

-- 18. Check for customers that might be filtered out by the app
SELECT 
  'CUSTOMERS WITH is_active = false' as filter,
  COUNT(*) as count
FROM customers 
WHERE is_active = false;

SELECT 
  'CUSTOMERS WITH is_active = true' as filter,
  COUNT(*) as count
FROM customers 
WHERE is_active = true;

SELECT 
  'CUSTOMERS WITH is_active = null' as filter,
  COUNT(*) as count
FROM customers 
WHERE is_active IS NULL;
