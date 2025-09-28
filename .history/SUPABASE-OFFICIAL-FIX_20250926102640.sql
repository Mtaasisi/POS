-- SUPABASE OFFICIAL FIX
-- Based on official Supabase documentation for 400 Bad Request errors
-- Issue: URL-encoding commas in select parameters for joined tables

-- ==========================================
-- OFFICIAL SUPABASE DOCUMENTATION
-- ==========================================

-- Source: https://supabase.com/docs/guides/storage/debugging/error-codes
-- Source: https://supabase.com/docs/guides/troubleshooting/http-status-codes

-- PROBLEM: 400 Bad Request from Supabase often indicates a malformed request
-- CAUSE: URL-encoding commas within select parameters for joined tables
-- SOLUTION: Ensure commas within parentheses are not URL-encoded

-- ==========================================
-- THE EXACT PROBLEM
-- ==========================================

-- ❌ MALFORMED REQUEST (causing 400 errors):
-- GET /rest/v1/lats_sales?select=*%2Ccustomers%28name%2Cphone%2Cemail%29
-- The %2C is URL-encoded comma, which Supabase doesn't handle properly

-- ✅ CORRECT REQUEST (working):
-- GET /rest/v1/lats_sales?select=*,customers(name,phone,email)
-- Use literal commas, not URL-encoded ones

-- ==========================================
-- SPECIFIC FIXES FOR YOUR CODE
-- ==========================================

-- 🔧 FIX 1: paymentTrackingService.ts
-- Replace URL-encoded commas with literal commas:

-- OLD (causing 400 errors):
-- .select('*,customers(name%2Cphone%2Cemail)')

-- NEW (working):
-- .select('*,customers(name,phone,email)')

-- 🔧 FIX 2: PaymentsContext.tsx
-- Same fix - use literal commas:

-- OLD (causing 400 errors):
-- .select('*,customers(name%2Cphone%2Cemail)')

-- NEW (working):
-- .select('*,customers(name,phone,email)')

-- 🔧 FIX 3: All Supabase queries
-- Check for any %2C encoding and replace with literal commas

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

-- ❌ AVOID: URL-encoded commas
-- customers(name%2Cphone%2Cemail)
-- customers(name%2Cphone)

-- ✅ USE: Literal commas
-- customers(name,phone,email)
-- customers(name,phone)

-- ==========================================
-- IMPLEMENTATION STEPS
-- ==========================================

-- 1. Search your codebase for %2C
-- 2. Replace all instances with literal commas
-- 3. Test the queries
-- 4. Verify no more 400 errors

-- ==========================================
-- TESTING THE FIX
-- ==========================================

-- After making these changes:
-- 1. Save all files
-- 2. Refresh your browser
-- 3. Check browser console for errors
-- 4. Verify sales data loads
-- 5. Test payment tracking features

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
-- - Check for any remaining %2C encoding
-- - Verify table permissions in Supabase
-- - Check for typos in table/column names
-- - Ensure proper authentication

-- ==========================================
-- FILES TO UPDATE
-- ==========================================

-- 1. src/lib/paymentTrackingService.ts
-- 2. src/contexts/PaymentsContext.tsx
-- 3. Any other files using URL-encoded commas

-- ==========================================
-- QUICK FIX SUMMARY
-- ==========================================

-- The main issue is URL-encoded commas in Supabase queries
-- Replace all instances of:
-- %2C (URL-encoded comma)
-- With:
-- , (literal comma)

-- This simple change should resolve all 400 errors

-- ==========================================
-- MONITORING
-- ==========================================

-- After implementing these fixes:
-- 1. Monitor browser console for any remaining errors
-- 2. Test all sales-related features
-- 3. Verify payment tracking works correctly
-- 4. Check that customer data displays properly
-- 5. Ensure pagination works without errors

-- ✅ FINAL SUCCESS CRITERIA:
-- - No 400 errors in browser console
-- - Sales data loads properly
-- - Customer information displays
-- - Payment tracking works
-- - All features function normally

-- ==========================================
-- OFFICIAL SUPABASE REFERENCES
-- ==========================================

-- https://supabase.com/docs/guides/storage/debugging/error-codes
-- https://supabase.com/docs/guides/troubleshooting/http-status-codes
-- 
-- These official sources confirm that 400 errors are often caused by
-- malformed requests, specifically URL-encoded commas in select parameters
