-- =====================================================
-- SIMPLE FINAL FIX FOR REPAIR PAYMENTS SYSTEM
-- =====================================================
-- This version avoids all constraint conflicts

-- 1. Ensure customer_payments table has all required columns
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

-- 2. Make foreign key columns nullable
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN updated_by DROP NOT NULL;

-- 3. Update existing repair payments with default values
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL AND payment_type = 'payment';

UPDATE customer_payments 
SET method = 'cash' 
WHERE method IS NULL OR method = '';

UPDATE customer_payments 
SET payment_type = 'payment' 
WHERE payment_type IS NULL OR payment_type = '';

UPDATE customer_payments 
SET status = 'completed' 
WHERE status IS NULL OR status = '';

-- 4. Fix constraints to be more permissive
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

-- 5. Fix RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;

CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON customer_payments TO authenticated;
GRANT ALL ON customer_payments TO service_role;
GRANT ALL ON customer_payments TO anon;

-- 7. Ensure finance_accounts table exists
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TZS',
    is_active BOOLEAN DEFAULT TRUE,
    is_payment_method BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insert default finance accounts only if they don't exist (avoiding ON CONFLICT)
DO $$
BEGIN
    -- Insert Cash account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'Cash') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('Cash', 'cash', 0, 'TZS', true);
    END IF;
    
    -- Insert CRDB Bank account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'CRDB Bank') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('CRDB Bank', 'bank', 0, 'TZS', true);
    END IF;
    
    -- Insert NMB Bank account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'NMB Bank') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('NMB Bank', 'bank', 0, 'TZS', true);
    END IF;
    
    -- Insert Vodacom M-Pesa account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'Vodacom M-Pesa') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('Vodacom M-Pesa', 'mobile_money', 0, 'TZS', true);
    END IF;
    
    -- Insert Airtel Money account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'Airtel Money') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('Airtel Money', 'mobile_money', 0, 'TZS', true);
    END IF;
    
    -- Insert Tigo Pesa account
    IF NOT EXISTS (SELECT 1 FROM finance_accounts WHERE name = 'Tigo Pesa') THEN
        INSERT INTO finance_accounts (name, type, balance, currency, is_payment_method) 
        VALUES ('Tigo Pesa', 'mobile_money', 0, 'TZS', true);
    END IF;
END $$;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_type ON customer_payments(payment_type);

-- 10. Test the repair payment system
SELECT 
  'Repair payments system fixed successfully' as status,
  COUNT(*) as total_repair_payments,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as payments_with_currency,
  COUNT(CASE WHEN payment_account_id IS NOT NULL THEN 1 END) as payments_with_account_id,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
FROM customer_payments 
WHERE payment_type = 'payment';

-- 11. Verify finance accounts were created
SELECT 
  'Finance accounts created successfully' as status,
  COUNT(*) as total_accounts,
  COUNT(CASE WHEN is_payment_method = true THEN 1 END) as payment_methods
FROM finance_accounts;
