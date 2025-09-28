-- Fix for the new 400 error on customer_payments record 310ad7d2-1523-42ec-9a15-384fd1ade2fa
-- This addresses potential data integrity issues and constraint violations

-- 1. First, let's see what we're working with
SELECT 
  id,
  customer_id,
  amount,
  method,
  payment_type,
  status,
  currency
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 2. Fix any NULL values in required fields
UPDATE customer_payments 
SET 
  method = COALESCE(method, 'cash'),
  payment_type = COALESCE(payment_type, 'payment'),
  status = COALESCE(status, 'completed'),
  currency = COALESCE(currency, 'TZS')
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND (method IS NULL OR payment_type IS NULL OR status IS NULL OR currency IS NULL);

-- 3. Ensure amount is valid (not NULL and positive)
UPDATE customer_payments 
SET amount = 0.00
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND (amount IS NULL OR amount < 0);

-- 4. Fix any invalid method values
UPDATE customer_payments 
SET method = 'cash'
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND method NOT IN ('cash', 'card', 'transfer', 'mpesa', 'zenopay', 'bank_transfer', 'mobile_money', 'credit', 'debit');

-- 5. Fix any invalid status values
UPDATE customer_payments 
SET status = 'completed'
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND status NOT IN ('completed', 'pending', 'failed', 'approved', 'cancelled', 'processing', 'refunded');

-- 6. Fix any invalid payment_type values
UPDATE customer_payments 
SET payment_type = 'payment'
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND payment_type NOT IN ('payment', 'deposit', 'refund', 'partial_payment');

-- 7. Fix any invalid currency values
UPDATE customer_payments 
SET currency = 'TZS'
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND currency NOT IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY');

-- 8. Ensure customer_id exists (if it's NULL, we need to handle this)
UPDATE customer_payments 
SET customer_id = (
  SELECT id FROM customers LIMIT 1
)
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa'
  AND customer_id IS NULL
  AND EXISTS (SELECT 1 FROM customers LIMIT 1);

-- 9. Test the update with the problematic record
UPDATE customer_payments 
SET 
  amount = COALESCE(amount, 0.00),
  method = COALESCE(method, 'cash'),
  status = 'completed',
  updated_at = NOW()
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 10. Verify the update worked
SELECT 
  id,
  customer_id,
  amount,
  method,
  payment_type,
  status,
  currency,
  updated_at
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 11. If the record still doesn't exist, let's check if it was deleted
SELECT COUNT(*) as total_customer_payments
FROM customer_payments;

-- 12. Check for any similar IDs (in case of typo)
SELECT id, customer_id, amount, method, status
FROM customer_payments 
WHERE id::text LIKE '%310ad7d2%' 
   OR id::text LIKE '%1523%'
   OR id::text LIKE '%42ec%'
   OR id::text LIKE '%9a15%'
   OR id::text LIKE '%384fd1ade2fa%';
