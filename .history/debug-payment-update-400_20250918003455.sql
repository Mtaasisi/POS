-- =====================================================
-- DEBUG PAYMENT UPDATE 400 ERROR
-- =====================================================
-- This helps identify what's causing the 400 error when updating payments

-- 1. Check the specific payment that's failing
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
  updated_at,
  created_by,
  updated_by
FROM customer_payments 
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91';

-- 2. Check if the payment account ID exists
SELECT 
  id,
  name,
  currency,
  balance,
  is_active
FROM finance_accounts 
WHERE id = 'deb92580-95dd-4018-9f6a-134b2157716c';

-- 3. Check if the payment method ID exists
SELECT 
  id,
  name,
  is_active
FROM payment_methods 
WHERE id = '2967defd-2931-4315-a917-af62cfe310e1';

-- 4. Check customer_payments table constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customer_payments'::regclass;

-- 5. Check if there are any triggers on customer_payments
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'customer_payments';

-- 6. Test a simple update to see what fails
-- First, let's try updating just the status
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'
RETURNING id, status, updated_at;

-- 7. Check RLS policies on customer_payments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'customer_payments';

-- 8. Check if the user has permission to update this payment
SELECT 
  current_user,
  session_user,
  current_setting('role', true) as current_role;
