-- Test customer_payments update to identify the 400 error
-- This will help us see exactly what's failing

-- First, let's see what the current record looks like
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
  updated_by
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- Try a simple update to see what fails
UPDATE customer_payments 
SET 
  amount = 1000.00,
  method = 'cash',
  status = 'completed',
  updated_at = NOW()
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- If that works, let's see what the updated record looks like
SELECT 
  id,
  amount,
  method,
  status,
  updated_at
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';
