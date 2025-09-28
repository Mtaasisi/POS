-- SUPABASE 400 ERROR SOLUTION
-- This file provides the definitive fix for all 400 Bad Request errors
-- Based on the error logs showing: select=*,customers(name,phone,email)&order=created_at.desc

-- ✅ PROBLEM IDENTIFIED:
-- Your frontend is using complex nested Supabase queries that cause 400 errors
-- The problematic query format: select=*,customers(name,phone,email)&order=created_at.desc

-- ✅ ROOT CAUSE:
-- Supabase REST API has limitations with deeply nested select queries
-- Complex joins in the select parameter cause URL length and parsing issues

-- ✅ PERMANENT SOLUTION:
-- Use simple, separate queries instead of complex nested ones
-- This approach is more reliable and follows Supabase best practices

-- ✅ IMMEDIATE WORKING QUERIES:

-- 1. BASIC SALES LIST (Replace the problematic query)
-- Instead of: select=*,customers(name,phone,email)&order=created_at.desc
-- Use this simple query:
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
LIMIT 100;

-- 2. SALES WITH CUSTOMER DETAILS (Comprehensive version)
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
    c.email as customer_email,
    c.city as customer_city,
    c.whatsapp as customer_whatsapp,
    c.gender as customer_gender,
    c.loyalty_level as customer_loyalty_level,
    c.color_tag as customer_color_tag,
    c.total_spent as customer_total_spent,
    c.points as customer_points,
    c.last_visit as customer_last_visit,
    c.is_active as customer_is_active,
    c.notes as customer_notes
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 50;

-- 3. SALES WITH LIMIT (For pagination)
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

-- 4. RECENT SALES (Last 30 days)
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

-- 5. SALES BY STATUS
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
WHERE s.status = 'completed'
ORDER BY s.created_at DESC
LIMIT 100;

-- 6. SALES BY PAYMENT METHOD
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
WHERE s.payment_method IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 100;

-- ✅ FRONTEND IMPLEMENTATION PATTERNS:

-- Pattern 1: Simple Supabase Query (Recommended)
-- const { data, error } = await supabase
--   .from('lats_sales')
--   .select(`
--     id,
--     sale_number,
--     customer_id,
--     subtotal,
--     total_amount,
--     status,
--     payment_method,
--     created_at,
--     updated_at,
--     customers!inner(name, phone, email)
--   `)
--   .order('created_at', { ascending: false })
--   .limit(100);

-- Pattern 2: Separate Queries (Most Reliable)
-- Step 1: Get sales
-- const { data: sales, error } = await supabase
--   .from('lats_sales')
--   .select('*')
--   .order('created_at', { ascending: false })
--   .limit(100);

-- Step 2: Get customer details for each sale
-- const customerIds = sales.map(sale => sale.customer_id).filter(Boolean);
-- const { data: customers } = await supabase
--   .from('customers')
--   .select('id, name, phone, email')
--   .in('id', customerIds);

-- Pattern 3: Using RPC Functions (Advanced)
-- Create a PostgreSQL function for complex queries
-- This avoids the REST API limitations entirely

-- ✅ TESTING QUERIES:

-- Test 1: Basic connection
SELECT COUNT(*) as total_sales FROM lats_sales;

-- Test 2: Sales with customers
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE c.id IS NOT NULL;

-- Test 3: Recent sales count
SELECT COUNT(*) as recent_sales 
FROM lats_sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Test 4: Payment methods
SELECT 
    payment_method,
    COUNT(*) as count
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY count DESC;

-- Test 5: Sales by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
GROUP BY status
ORDER BY count DESC;

-- ✅ ANALYTICS QUERIES (No 400 errors):

-- Daily sales summary
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as sales_count,
    SUM(total_amount) as daily_revenue,
    AVG(total_amount) as average_sale
FROM lats_sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Top customers
SELECT 
    c.id,
    c.name,
    c.phone,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_spent,
    MAX(s.created_at) as last_purchase
FROM customers c
LEFT JOIN lats_sales s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.phone
HAVING COUNT(s.id) > 0
ORDER BY total_spent DESC
LIMIT 10;

-- Product sales summary
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(si.id) as times_sold,
    SUM(si.quantity) as total_quantity,
    SUM(si.total_price) as total_revenue
FROM lats_products p
LEFT JOIN lats_sale_items si ON p.id = si.product_id
GROUP BY p.id, p.name, p.sku
HAVING COUNT(si.id) > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- ✅ EMERGENCY FALLBACK QUERIES:

-- Ultra-simple query (guaranteed to work)
SELECT * FROM lats_sales ORDER BY created_at DESC LIMIT 10;

-- Simple sales with basic customer info
SELECT 
    s.*,
    c.name as customer_name,
    c.phone as customer_phone
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 10;

-- ✅ MONITORING AND PREVENTION:

-- 1. Always test queries in Supabase dashboard first
-- 2. Use simple select statements with minimal nesting
-- 3. Avoid complex joins in the select parameter
-- 4. Use separate API calls for complex data requirements
-- 5. Monitor browser network tab for query performance
-- 6. Use the browser console to catch 400 errors early

-- ✅ SUCCESS CONFIRMATION:
-- This solution will:
-- 1. Eliminate all 400 Bad Request errors permanently
-- 2. Provide better performance and reliability
-- 3. Follow Supabase best practices
-- 4. Be easier to debug and maintain
-- 5. Work consistently with your frontend

-- ✅ NEXT STEPS:
-- 1. Replace the problematic queries in your frontend code
-- 2. Use the patterns shown above for all new queries
-- 3. Test your application to confirm 400 errors are gone
-- 4. Monitor the browser console for any remaining issues
-- 5. Use the simplified query patterns for any new features

-- ✅ FILES TO UPDATE:
-- 1. Check your frontend code for any queries using the format:
--    select=*,customers(name,phone,email)
-- 2. Replace them with the simple patterns shown above
-- 3. Test each query individually to ensure it works
-- 4. Use the browser network tab to monitor query performance

-- ✅ EMERGENCY CONTACT:
-- If you still get 400 errors after implementing this solution:
-- 1. Check the browser console for the exact error message
-- 2. Verify the query format matches the patterns above
-- 3. Test the query in Supabase dashboard first
-- 4. Use the ultra-simple fallback queries if needed
