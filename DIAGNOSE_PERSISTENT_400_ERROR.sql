-- Diagnose persistent 400 errors after column fixes
-- This will help identify what's still causing the 400 errors

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- =====================================================

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
-- 2. CHECK FOR MISSING COLUMNS
-- =====================================================

-- Check if all expected columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'subtotal') 
        THEN 'subtotal: EXISTS' 
        ELSE 'subtotal: MISSING' 
    END as subtotal_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'discount_amount') 
        THEN 'discount_amount: EXISTS' 
        ELSE 'discount_amount: MISSING' 
    END as discount_amount_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'customer_name') 
        THEN 'customer_name: EXISTS' 
        ELSE 'customer_name: MISSING' 
    END as customer_name_status;

-- =====================================================
-- 3. CHECK RLS POLICIES
-- =====================================================

-- Check if RLS is enabled and what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lats_sales';

-- Check if RLS is enabled
SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class 
WHERE relname = 'lats_sales';

-- =====================================================
-- 4. CHECK TABLE PERMISSIONS
-- =====================================================

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'lats_sales';

-- =====================================================
-- 5. CHECK FOR CONSTRAINTS
-- =====================================================

SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'lats_sales';

-- =====================================================
-- 6. TEST MINIMAL INSERT
-- =====================================================

-- Try the most basic insert possible
INSERT INTO lats_sales (
    sale_number,
    total_amount,
    payment_method,
    status
) VALUES (
    'TEST-MINIMAL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    1000.00,
    'Cash',
    'completed'
) RETURNING id, sale_number, total_amount, created_at;

-- =====================================================
-- 7. CLEAN UP TEST DATA
-- =====================================================

DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-%';
