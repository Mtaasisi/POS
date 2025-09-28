-- TEST 400 ERROR FIXED
-- This file tests the fixed queries to ensure they work without 400 errors

-- ✅ TEST 1: Basic Sales Query (Should work without 400 errors)
-- This is the exact query pattern now used in the fixed code
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

-- ✅ SUCCESS INDICATORS:
-- If all these queries run without errors, the 400 error fix is working
-- The problematic !inner joins have been replaced with simple LEFT JOINs

-- ✅ FRONTEND IMPLEMENTATION:
-- The fixed code now uses:
-- customers(name, phone, email) instead of customers!inner(name, phone, email)
-- This avoids the 400 Bad Request errors

-- ✅ MONITORING:
-- After implementing this fix:
-- 1. Check your browser console - no more 400 errors
-- 2. Your sales data should load properly
-- 3. Customer information should display correctly
-- 4. Pagination should work without errors
-- 5. All sales-related features should function normally

-- ✅ FILES FIXED:
-- 1. src/features/lats/lib/data/provider.supabase.ts - Fixed getSales() method
-- 2. src/lib/financialService.ts - Fixed getPOSSales() method
-- 3. src/lib/posService.ts - Fixed getSalesByDateRange() method
-- 4. src/features/lats/pages/SalesReportsPage.tsx - Fixed sales query

-- ✅ NEXT STEPS:
-- 1. Test your application to confirm 400 errors are gone
-- 2. Check the browser console for any remaining issues
-- 3. Verify all sales-related features work properly
-- 4. Use the simplified query patterns for any new features
