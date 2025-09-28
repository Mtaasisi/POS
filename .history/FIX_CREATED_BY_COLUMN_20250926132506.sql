-- FIX CREATED_BY COLUMN - Addresses UUID type mismatch
-- The created_by column expects UUID but app is sending strings

-- =====================================================
-- 1. CHECK CURRENT CREATED_BY COLUMN TYPE
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name = 'created_by';

-- =====================================================
-- 2. DROP FOREIGN KEY CONSTRAINT AND CHANGE CREATED_BY TO VARCHAR
-- =====================================================

-- First, drop the foreign key constraint
ALTER TABLE lats_sales 
DROP CONSTRAINT IF EXISTS lats_sales_created_by_fkey;

-- Then change created_by from UUID to VARCHAR to accept string values
ALTER TABLE lats_sales 
ALTER COLUMN created_by TYPE VARCHAR(255);

-- =====================================================
-- 3. TEST WITH STRING VALUES
-- =====================================================

-- Test with "System" value
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    status,
    created_by
) VALUES (
    'TEST-SYSTEM-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    'completed',
    'System'
) RETURNING id, sale_number, total_amount, created_by, created_at;

-- Test with "care" value
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    status,
    created_by
) VALUES (
    'TEST-CARE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    'completed',
    'care'
) RETURNING id, sale_number, total_amount, created_by, created_at;

-- Test with full data including payment method
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    created_by,
    subtotal,
    discount_amount,
    discount_type,
    discount_value,
    customer_name,
    customer_phone,
    tax
) VALUES (
    'TEST-FULL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '5aeff05c-2490-4790-810a-3a01a433dd69',
    699112,
    '{"type":"CRDB Bank","details":{"payments":[{"method":"CRDB Bank","amount":699112,"accountId":"5b5e875d-f139-4ebe-b336-03615ea2e876","timestamp":"2025-09-26T10:21:57.027Z"}],"totalPaid":699112},"amount":699112}',
    'completed',
    'care',
    700000,
    888,
    'fixed',
    888,
    'Unknown Contact',
    '+2556166553111',
    0
) RETURNING id, sale_number, total_amount, payment_method, created_by, created_at;

-- =====================================================
-- 4. VERIFY THE FIX
-- =====================================================

-- Check the column type is now VARCHAR
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name = 'created_by';

-- =====================================================
-- 5. CLEAN UP TEST DATA
-- =====================================================

DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-%';

-- =====================================================
-- 6. FINAL STATUS
-- =====================================================

SELECT 
    'created_by column fixed - now accepts string values' as status,
    COUNT(*) as existing_sales_count
FROM lats_sales;
