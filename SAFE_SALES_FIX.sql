-- SAFE SALES FIX - Incremental approach without dropping table
-- This preserves existing data while fixing the issues

-- =====================================================
-- 1. FIX PAYMENT_METHOD COLUMN
-- =====================================================

-- Change payment_method to TEXT if it's not already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'payment_method' 
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE lats_sales ALTER COLUMN payment_method TYPE TEXT;
    END IF;
END $$;

-- =====================================================
-- 2. ADD MISSING COLUMNS
-- =====================================================

-- Add all missing columns that the app expects
ALTER TABLE lats_sales 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- =====================================================
-- 3. FIX CREATED_BY COLUMN
-- =====================================================

-- Make created_by nullable
ALTER TABLE lats_sales 
ALTER COLUMN created_by DROP NOT NULL;

-- =====================================================
-- 4. ENSURE RLS IS PROPERLY CONFIGURED
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read sales" ON lats_sales;
DROP POLICY IF EXISTS "Users can insert sales" ON lats_sales;
DROP POLICY IF EXISTS "Users can update sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can read sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON lats_sales;

-- Create new, simple policies
CREATE POLICY "Allow all operations for authenticated users" ON lats_sales
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 5. TEST THE FIX
-- =====================================================

-- Test with minimal data first
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

-- Test with full data
INSERT INTO lats_sales (
    sale_number,
    customer_id,
    total_amount,
    payment_method,
    status,
    subtotal,
    discount_amount,
    discount_type,
    discount_value,
    customer_name,
    customer_phone,
    tax
) VALUES (
    'TEST-FULL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'fee3e76e-6b3f-43ae-92ab-735fe41f7d97',
    500000.00,
    '{"type":"CRDB Bank","details":{"payments":[{"method":"CRDB Bank","amount":500000,"accountId":"5b5e875d-f139-4ebe-b336-03615ea2e876","timestamp":"2025-09-26T10:15:31.555Z"}],"totalPaid":500000},"amount":500000}',
    'completed',
    700000.00,
    200000.00,
    'fixed',
    200000.00,
    'Test 02',
    '+255755645478',
    0.00
) RETURNING id, sale_number, total_amount, payment_method, created_at;

-- =====================================================
-- 6. VERIFY STRUCTURE
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class 
WHERE relname = 'lats_sales';

-- =====================================================
-- 7. CLEAN UP TEST DATA
-- =====================================================

DELETE FROM lats_sales WHERE sale_number LIKE 'TEST-%';

-- =====================================================
-- 8. FINAL STATUS
-- =====================================================

SELECT 
    'lats_sales table fixed and ready' as status,
    COUNT(*) as existing_sales_count
FROM lats_sales;
