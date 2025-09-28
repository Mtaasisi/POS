-- EMERGENCY SALES FIX - Addresses persistent 400 errors
-- This is a more aggressive approach to fix the remaining issues

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY TO TEST
-- =====================================================

-- Disable RLS to see if that's causing the issue
ALTER TABLE lats_sales DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CHECK CURRENT TABLE STRUCTURE
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
-- 3. TEST BASIC INSERT WITHOUT RLS
-- =====================================================

-- Try the exact minimal insert that's failing
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    status,
    created_by
) VALUES (
    'TEST-EMERGENCY-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    'completed',
    'System'
) RETURNING id, sale_number, total_amount, created_at;

-- =====================================================
-- 4. TEST WITH PAYMENT METHOD
-- =====================================================

INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by
) VALUES (
    'TEST-PAYMENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    '{"type":"CRDB Bank","details":{"payments":[{"method":"CRDB Bank","amount":699112,"accountId":"5b5e875d-f139-4ebe-b336-03615ea2e876","timestamp":"2025-09-26T10:21:57.027Z"}],"totalPaid":699112},"amount":699112}',
    'completed',
    'care'
) RETURNING id, sale_number, total_amount, payment_method, created_at;

-- =====================================================
-- 5. RE-ENABLE RLS WITH SIMPLE POLICY
-- =====================================================

-- Re-enable RLS
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can read sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON lats_sales;

-- Create a very simple policy
CREATE POLICY "Simple sales policy" ON lats_sales
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. TEST WITH RLS ENABLED
-- =====================================================

INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by
) VALUES (
    'TEST-RLS-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    '{"type":"CRDB Bank","details":{"payments":[{"method":"CRDB Bank","amount":699112,"accountId":"5b5e875d-f139-4ebe-b336-03615ea2e876","timestamp":"2025-09-26T10:21:57.027Z"}],"totalPaid":699112},"amount":699112}',
    'completed',
    'care'
) RETURNING id, sale_number, total_amount, payment_method, created_at;

-- =====================================================
-- 7. CLEAN UP TEST DATA
-- =====================================================

DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-%';

-- =====================================================
-- 8. FINAL STATUS
-- =====================================================

SELECT 
    'Emergency fix applied - test your sales now' as status,
    COUNT(*) as existing_sales_count
FROM lats_sales;
