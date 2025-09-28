-- Debug the exact 400 error for customer_payments update
-- This will help us identify the specific issue

-- First, let's see the current state of the problematic record
SELECT 
  id,
  amount,
  method,
  status,
  payment_type,
  currency,
  updated_at,
  created_at
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- Try a minimal update to see what fails
UPDATE customer_payments 
SET status = 'completed'
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- If that works, try with amount
UPDATE customer_payments 
SET 
  status = 'completed',
  amount = 543554.00
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- If that works, try with method
UPDATE customer_payments 
SET 
  status = 'completed',
  amount = 543554.00,
  method = 'cash'
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- If that works, try with updated_at (this might be the issue)
UPDATE customer_payments 
SET 
  status = 'completed',
  amount = 543554.00,
  method = 'cash',
  updated_at = NOW()
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- Check the final state
SELECT 
  id,
  amount,
  method,
  status,
  updated_at
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';
