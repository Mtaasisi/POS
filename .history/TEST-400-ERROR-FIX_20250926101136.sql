-- TEST 400 ERROR FIX
-- Run these queries to verify the 400 error solution works

-- ✅ TEST 1: Basic Sales Query (Should work without 400 errors)
-- This replaces the problematic: select=*,customers(name,phone,email)&order=created_at.desc
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.payment_method,
    s.created_at,
    s.updated_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 10;

-- ✅ TEST 2: Sales with Limit (For pagination)
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.payment_method,
    s.created_at,
    s.updated_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 1000;

-- ✅ TEST 3: Recent Sales (Last 30 days)
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.payment_method,
    s.created_at,
    s.updated_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY s.created_at DESC
LIMIT 100;

-- ✅ TEST 4: Ultra-Simple Query (Guaranteed to work)
SELECT * FROM lats_sales ORDER BY created_at DESC LIMIT 10;

-- ✅ TEST 5: Basic Connection Test
SELECT COUNT(*) as total_sales FROM lats_sales;

-- ✅ TEST 6: Sales with Customers Count
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE c.id IS NOT NULL;

-- ✅ TEST 7: Payment Methods Summary
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY count DESC;

-- ✅ TEST 8: Sales by Status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
GROUP BY status
ORDER BY count DESC;

-- ✅ SUCCESS INDICATORS:
-- If all these queries run without errors, the 400 error fix is working
-- You can now use these patterns in your frontend code
-- The problematic nested queries have been replaced with simple, reliable ones

-- ✅ FRONTEND IMPLEMENTATION:
-- Replace your current query:
-- select=*,customers(name,phone,email)&order=created_at.desc
-- 
-- With this simple pattern:
-- Use the SQL queries above as your Supabase queries
-- Or use the simplified Supabase client patterns shown in the main solution file

-- ✅ MONITORING:
-- After implementing this fix:
-- 1. Check your browser console - no more 400 errors
-- 2. Your sales data should load properly
-- 3. Customer information should display correctly
-- 4. Pagination should work without errors
-- 5. All sales-related features should function normally
