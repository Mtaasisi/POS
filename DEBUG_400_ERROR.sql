-- DEBUG 400 ERROR - Detailed investigation
-- This will help identify the exact cause of the 400 error

-- =====================================================
-- 1. CHECK TABLE EXISTS AND STRUCTURE
-- =====================================================

SELECT 
    'Table exists' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') as result;

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK RLS STATUS
-- =====================================================

SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class 
WHERE relname = 'lats_sales';

-- =====================================================
-- 3. CHECK POLICIES
-- =====================================================

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lats_sales';

-- =====================================================
-- 4. CHECK PERMISSIONS
-- =====================================================

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'lats_sales';

-- =====================================================
-- 5. CHECK CONSTRAINTS
-- =====================================================

SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'lats_sales';

-- =====================================================
-- 6. TEST DIFFERENT INSERT APPROACHES
-- =====================================================

-- Test 1: Most basic insert
BEGIN;
INSERT INTO lats_sales (sale_number, total_amount, payment_method, status) 
VALUES ('TEST-BASIC-' || EXTRACT(EPOCH FROM NOW())::TEXT, 1000, 'Cash', 'completed');
ROLLBACK;

-- Test 2: With customer_id
BEGIN;
INSERT INTO lats_sales (sale_number, customer_id, total_amount, payment_method, status) 
VALUES ('TEST-CUSTOMER-' || EXTRACT(EPOCH FROM NOW())::TEXT, '5aeff05c-2490-4790-810a-3a01a433dd69', 1000, 'Cash', 'completed');
ROLLBACK;

-- Test 3: With created_by
BEGIN;
INSERT INTO lats_sales (sale_number, total_amount, payment_method, status, created_by) 
VALUES ('TEST-CREATED-' || EXTRACT(EPOCH FROM NOW())::TEXT, 1000, 'Cash', 'completed', 'care');
ROLLBACK;

-- =====================================================
-- 7. CHECK FOR FOREIGN KEY ISSUES
-- =====================================================

-- Check if customer exists
SELECT 'Customer exists' as check_type, 
       EXISTS(SELECT 1 FROM customers WHERE id = '5aeff05c-2490-4790-810a-3a01a433dd69') as result;

-- Check if auth user exists
SELECT 'Auth user exists' as check_type,
       EXISTS(SELECT 1 FROM auth.users WHERE id = 'a7c9adb7-f525-4850-bd42-79a769f12953') as result;

-- =====================================================
-- 8. FINAL DIAGNOSIS
-- =====================================================

SELECT 
    'Diagnosis complete - check results above' as status;
