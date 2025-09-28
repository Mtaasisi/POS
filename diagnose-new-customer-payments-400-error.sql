-- Diagnose the new 400 error for customer_payments record 310ad7d2-1523-42ec-9a15-384fd1ade2fa
-- This will help identify what's different about this record

-- 1. Check the specific record that's failing
SELECT 
  id,
  customer_id,
  device_id,
  amount,
  method,
  payment_type,
  status,
  payment_date,
  created_by,
  created_at,
  updated_at,
  currency,
  payment_account_id,
  payment_method_id,
  reference,
  notes,
  approved_at,
  approved_by,
  updated_by
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 2. Check if this record exists
SELECT COUNT(*) as record_exists
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 3. Check for any NULL values in required fields
SELECT 
  id,
  customer_id,
  amount,
  method,
  payment_type,
  CASE 
    WHEN customer_id IS NULL THEN 'customer_id is NULL'
    WHEN amount IS NULL THEN 'amount is NULL'
    WHEN method IS NULL THEN 'method is NULL'
    WHEN payment_type IS NULL THEN 'payment_type is NULL'
    ELSE 'All required fields have values'
  END as null_check
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 4. Check if the method value is valid according to constraints
SELECT 
  id,
  method,
  CASE 
    WHEN method IN ('cash', 'card', 'transfer', 'mpesa', 'zenopay', 'bank_transfer', 'mobile_money', 'credit', 'debit') 
    THEN 'Valid method'
    ELSE 'Invalid method: ' || method
  END as method_check
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 5. Check if the status value is valid according to constraints
SELECT 
  id,
  status,
  CASE 
    WHEN status IN ('completed', 'pending', 'failed', 'approved', 'cancelled', 'processing', 'refunded') 
    THEN 'Valid status'
    ELSE 'Invalid status: ' || COALESCE(status, 'NULL')
  END as status_check
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 6. Check if the payment_type value is valid according to constraints
SELECT 
  id,
  payment_type,
  CASE 
    WHEN payment_type IN ('payment', 'deposit', 'refund', 'partial_payment') 
    THEN 'Valid payment_type'
    ELSE 'Invalid payment_type: ' || payment_type
  END as payment_type_check
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 7. Check foreign key constraints
SELECT 
  id,
  customer_id,
  CASE 
    WHEN customer_id IS NOT NULL THEN 
      (SELECT COUNT(*) FROM customers WHERE id = customer_id)::text || ' customer records found'
    ELSE 'customer_id is NULL'
  END as customer_fk_check
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 8. Try a minimal update to isolate the issue
UPDATE customer_payments 
SET updated_at = NOW()
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 9. If that works, try with status
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';

-- 10. Check the final state
SELECT 
  id,
  amount,
  method,
  status,
  payment_type,
  updated_at
FROM customer_payments 
WHERE id = '310ad7d2-1523-42ec-9a15-384fd1ade2fa';
