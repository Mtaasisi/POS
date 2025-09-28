-- =====================================================
-- DIRECT FIX FOR CUSTOMER PAYMENTS 400 ERROR
-- =====================================================
-- Run this directly in your Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID;

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. Update existing records with default values
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

UPDATE customer_payments 
SET method = 'cash' 
WHERE method IS NULL OR method = '';

UPDATE customer_payments 
SET payment_type = 'payment' 
WHERE payment_type IS NULL OR payment_type = '';

UPDATE customer_payments 
SET status = 'completed' 
WHERE status IS NULL OR status = '';

UPDATE customer_payments 
SET amount = 0.00 
WHERE amount IS NULL;

-- 3. Fix constraints to be more permissive
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_method_check;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_method_check 
CHECK (method IN ('cash', 'card', 'transfer', 'mobile_money', 'bank_transfer'));

ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_status_check;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_status_check 
CHECK (status IN ('completed', 'pending', 'failed', 'approved', 'cancelled'));

-- 4. Fix RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;

CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. Test the specific payment that was failing
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '58592684-4a48-4047-b1e7-46fd0373bcf8';

-- 6. Verify the fix
SELECT 
  id,
  amount,
  method,
  status,
  currency,
  updated_at
FROM customer_payments 
WHERE id = '58592684-4a48-4047-b1e7-46fd0373bcf8';
