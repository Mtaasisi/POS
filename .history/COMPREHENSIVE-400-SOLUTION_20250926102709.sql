-- COMPREHENSIVE 400 SOLUTION
-- Complete fix for Supabase 400 Bad Request errors
-- Based on detailed analysis of the problem

-- ==========================================
-- PROBLEM ANALYSIS
-- ==========================================

-- ❌ FAILING REQUEST:
-- GET /rest/v1/lats_sales?select=*%2Ccustomers%28name%2Cphone%2Cemail%29&order=created_at.desc
-- Status: 400 Bad Request

-- ISSUES IDENTIFIED:
-- 1. URL-encoded commas (%2C) in select parameter
-- 2. Possible incorrect relationship name
-- 3. Potential missing columns or tables
-- 4. Malformed request structure

-- ==========================================
-- VERIFICATION STEPS
-- ==========================================

-- ✅ STEP 1: Verify table structure
-- Check if these tables exist:
-- - lats_sales table
-- - customers table
-- - Relationship between them

-- ✅ STEP 2: Verify column names
-- Check if these columns exist:
-- - lats_sales: created_at, customer_id
-- - customers: name, phone, email

-- ✅ STEP 3: Verify relationship
-- Check the foreign key relationship:
-- - lats_sales.customer_id -> customers.id
-- - Or the correct relationship name in your schema

-- ==========================================
-- SOLUTION 1: Fix URL Encoding
-- ==========================================

-- ❌ PROBLEMATIC (causing 400 errors):
-- select=*%2Ccustomers%28name%2Cphone%2Cemail%29
-- The %2C is URL-encoded comma

-- ✅ FIXED (working):
-- select=*,customers(name,phone,email)
-- Use literal commas, not URL-encoded ones

-- ==========================================
-- SOLUTION 2: Fix Relationship Name
-- ==========================================

-- If the relationship name is incorrect, try these alternatives:

-- ✅ OPTION 1: Use foreign key column name
-- select=*,customer_id(name,phone,email)

-- ✅ OPTION 2: Use correct relationship name
-- select=*,customers(name,phone,email)

-- ✅ OPTION 3: Use explicit join syntax
-- select=*,customers!inner(name,phone,email)

-- ==========================================
-- SOLUTION 3: Verify Schema
-- ==========================================

-- Check your Supabase schema for:

-- 1. Table existence:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('lats_sales', 'customers');

-- 2. Column existence:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'customers' 
-- AND column_name IN ('name', 'phone', 'email');

-- 3. Relationship verification:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'lats_sales' 
-- AND column_name = 'customer_id';

-- ==========================================
-- IMPLEMENTATION STEPS
-- ==========================================

-- 🔧 STEP 1: Fix URL encoding
-- Replace all %2C with literal commas

-- 🔧 STEP 2: Verify relationship name
-- Check your Supabase schema for the correct relationship name

-- 🔧 STEP 3: Test the query
-- Use the corrected syntax

-- 🔧 STEP 4: Monitor for errors
-- Check browser console for any remaining issues

-- ==========================================
-- WORKING QUERY PATTERNS
-- ==========================================

-- ✅ PATTERN 1: Basic sales query
-- .select('*,customers(name,phone,email)')
-- .order('created_at', { ascending: false })

-- ✅ PATTERN 2: Sales with limit
-- .select('*,customers(name)')
-- .order('created_at', { ascending: false })
-- .limit(1000)

-- ✅ PATTERN 3: Sales with date filter
-- .select('*,customers(name,phone,email)')
-- .gte('created_at', startDate)
-- .lte('created_at', endDate)
-- .order('created_at', { ascending: false })

-- ==========================================
-- TROUBLESHOOTING
-- ==========================================

-- If errors persist after fixing URL encoding:

-- 1. Check table permissions in Supabase
-- 2. Verify authentication is working
-- 3. Check for typos in table/column names
-- 4. Ensure proper relationship configuration

-- ==========================================
-- FILES TO UPDATE
-- ==========================================

-- 1. src/lib/paymentTrackingService.ts
-- 2. src/contexts/PaymentsContext.tsx
-- 3. Any other files using the failing queries

-- ==========================================
-- SUCCESS VERIFICATION
-- ==========================================

-- ✅ SUCCESS INDICATORS:
-- - No more "400 (Bad Request)" errors
-- - Sales data loads properly
-- - Customer information displays correctly
-- - Payment tracking works without errors
-- - All Supabase queries execute successfully

-- ❌ IF ERRORS PERSIST:
-- - Double-check table and column names
-- - Verify relationship configuration
-- - Check Supabase permissions
-- - Ensure proper authentication

-- ==========================================
-- FINAL IMPLEMENTATION
-- ==========================================

-- 1. Fix URL encoding (replace %2C with ,)
-- 2. Verify relationship name in your schema
-- 3. Test the corrected queries
-- 4. Monitor for any remaining errors

-- ✅ EXPECTED RESULT:
-- All 400 errors should be resolved
-- Your application should work normally
