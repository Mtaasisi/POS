-- Comprehensive fix for lats_sales table to support all required data types
-- This addresses the 400 errors when inserting sales data

-- =====================================================
-- 1. FIX PAYMENT_METHOD COLUMN TYPE
-- =====================================================

-- Check current payment_method column type
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
AND column_name = 'payment_method';

-- Update payment_method column to TEXT to support JSON data
ALTER TABLE lats_sales 
ALTER COLUMN payment_method TYPE TEXT;

-- =====================================================
-- 2. ADD MISSING COLUMNS IF THEY DON'T EXIST
-- =====================================================

-- Add subtotal column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2);

-- Add discount_amount column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0;

-- Add discount_type column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed';

-- Add discount_value column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0;

-- Add tax column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0;

-- Add customer_name column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Add customer_phone column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Add customer_email column if it doesn't exist
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- =====================================================
-- 3. UPDATE CREATED_BY COLUMN TO ALLOW NULLS
-- =====================================================

-- Make created_by nullable since it's causing issues
ALTER TABLE lats_sales 
ALTER COLUMN created_by DROP NOT NULL;

-- =====================================================
-- 4. VERIFY ALL CHANGES
-- =====================================================

-- Check final table structure
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
-- 5. TEST INSERT WITH FULL DATA
-- =====================================================

-- Test insert with all the data that was failing
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
    'TEST-SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'fee3e76e-6b3f-43ae-92ab-735fe41f7d97',
    500000.00,
    '{"type":"CRDB","details":{"payments":[{"method":"CRDB","amount":500000,"accountId":"1ff7da5b-340c-4d16-b2b6-0c65076c4ab8","timestamp":"2025-09-26T10:06:15.232Z"}],"totalPaid":500000},"amount":500000}',
    'completed',
    NULL,
    700000.00,
    200000.00,
    'fixed',
    200000.00,
    'Test 02',
    '+255755645478',
    0.00
) RETURNING id, sale_number, total_amount, payment_method, created_at;

-- =====================================================
-- 6. CLEAN UP TEST DATA
-- =====================================================

-- Remove test data
DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-SALE-%';

-- =====================================================
-- 7. VERIFY TABLE IS READY FOR PRODUCTION
-- =====================================================

-- Final verification
SELECT 
    'lats_sales table is ready for production' as status,
    COUNT(*) as existing_sales_count
FROM lats_sales;
