-- =====================================================
-- DEBUG PAYMENT DATA BEING SENT
-- =====================================================
-- This helps identify what data is causing the 400 error

-- 1. Check the current state of the payment
SELECT 
  id,
  customer_id,
  device_id,
  amount,
  method,
  payment_type,
  status,
  currency,
  payment_account_id,
  payment_method_id,
  reference,
  notes,
  payment_date,
  created_at,
  updated_at
FROM customer_payments 
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91';

-- 2. Check what data types are expected
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
AND column_name IN ('amount', 'method', 'currency', 'reference', 'notes', 'payment_date')
ORDER BY ordinal_position;

-- 3. Test a minimal update to see what works
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'
RETURNING id, status, updated_at;

-- 4. Test adding one field at a time
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW(),
  amount = 43355.00
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'
RETURNING id, status, amount, updated_at;

-- 5. Test adding method field
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW(),
  amount = 43355.00,
  method = 'cash'
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'
RETURNING id, status, amount, method, updated_at;
