-- COMPREHENSIVE 400 ERROR FIX
-- This file provides the complete solution for all 400 Bad Request errors
-- The issue is with Supabase query syntax using !inner joins

-- ❌ PROBLEMATIC QUERIES (causing 400 errors):
-- 1. select=*,customers(name,phone,email) - This works
-- 2. select=*,customers!inner(name) - This causes 400 errors
-- 3. Complex nested queries with !inner syntax

-- ✅ SOLUTION: Use proper Supabase query syntax

-- ==========================================
-- 1. FIXED SALES QUERIES (No 400 errors)
-- ==========================================

-- ✅ Basic Sales Query (Replaces the failing query)
-- OLD: select=*,customers!inner(name,phone,email)
-- NEW: Use proper Supabase syntax
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
ORDER BY s.created_at DESC;

-- ✅ Sales Query with Limit (For pagination)
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

-- ✅ Sales Query with Date Filter
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
WHERE s.created_at >= '2025-01-01'
ORDER BY s.created_at DESC
LIMIT 1000;

-- ==========================================
-- 2. FRONTEND CODE FIXES NEEDED
-- ==========================================

-- 🔧 FIX 1: PaymentsContext.tsx
-- Replace the failing query:
-- OLD: .select('*,customers!inner(name,phone,email)')
-- NEW: Use separate queries or proper syntax

-- 🔧 FIX 2: paymentTrackingService.ts
-- Replace the failing query:
-- OLD: .select('*,customers!inner(name)')
-- NEW: Use LEFT JOIN approach

-- 🔧 FIX 3: All Supabase queries
-- Replace !inner with proper LEFT JOIN syntax
-- Use separate API calls if needed

-- ==========================================
-- 3. WORKING SUPABASE QUERY PATTERNS
-- ==========================================

-- ✅ Pattern 1: Simple select (works)
-- select=*&order=created_at.desc

-- ✅ Pattern 2: With customer data (works)
-- select=*,customers(name,phone,email)&order=created_at.desc

-- ✅ Pattern 3: With limit (works)
-- select=*,customers(name,phone,email)&order=created_at.desc&limit=1000

-- ❌ AVOID: !inner syntax (causes 400 errors)
-- select=*,customers!inner(name,phone,email)

-- ==========================================
-- 4. IMPLEMENTATION STRATEGY
-- ==========================================

-- Step 1: Update all Supabase queries to remove !inner syntax
-- Step 2: Use LEFT JOIN approach in SQL queries
-- Step 3: Test each query individually
-- Step 4: Update frontend code to use working patterns

-- ==========================================
-- 5. TESTING QUERIES
-- ==========================================

-- ✅ Test 1: Basic connection
SELECT COUNT(*) as total_sales FROM lats_sales;

-- ✅ Test 2: Sales with customers
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE c.id IS NOT NULL;

-- ✅ Test 3: Recent sales
SELECT COUNT(*) as recent_sales 
FROM lats_sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- ✅ Test 4: Sales by status
SELECT status, COUNT(*) as count 
FROM lats_sales 
GROUP BY status;

-- ==========================================
-- 6. MONITORING SUCCESS
-- ==========================================

-- After implementing these fixes:
-- ✅ No more 400 Bad Request errors in browser console
-- ✅ Sales data loads properly
-- ✅ Customer information displays correctly
-- ✅ Pagination works without errors
-- ✅ All payment tracking features function normally

-- ==========================================
-- 7. FILES TO UPDATE
-- ==========================================

-- 1. src/features/lats/lib/data/provider.supabase.ts
-- 2. src/lib/financialService.ts
-- 3. src/lib/posService.ts
-- 4. src/features/lats/pages/SalesReportsPage.tsx
-- 5. src/lib/paymentTrackingService.ts
-- 6. src/contexts/PaymentsContext.tsx

-- ==========================================
-- 8. NEXT STEPS
-- ==========================================

-- 1. Apply the SQL query fixes above
-- 2. Update frontend code to use working query patterns
-- 3. Test the application thoroughly
-- 4. Monitor browser console for any remaining errors
-- 5. Verify all sales and payment features work correctly

-- ✅ SUCCESS CRITERIA:
-- - No 400 errors in browser console
-- - Sales data loads properly
-- - Customer information displays
-- - Payment tracking works
-- - All features function normally
