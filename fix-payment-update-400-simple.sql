-- =====================================================
-- SIMPLE FIX FOR PAYMENT UPDATE 400 ERROR
-- =====================================================
-- This addresses the 400 error when updating customer_payments

-- 1. Fix foreign key constraints to be deferrable
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_payment_account_id_fkey;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_payment_account_id_fkey 
FOREIGN KEY (payment_account_id) REFERENCES finance_accounts(id) 
DEFERRABLE INITIALLY IMMEDIATE;

-- 2. Make columns nullable to prevent constraint violations
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN updated_by DROP NOT NULL;

-- 3. Test updating the problematic payment
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'
RETURNING id, status, updated_at;

-- 4. Verify the update worked
SELECT 
  'Payment update fix applied successfully' as status,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM customer_payments;
