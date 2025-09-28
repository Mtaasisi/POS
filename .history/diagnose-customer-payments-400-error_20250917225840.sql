-- Comprehensive diagnosis of customer_payments 400 error
-- This will identify the exact cause of the PATCH operation failure

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
  updated_by
FROM customer_payments 
WHERE id = '4786304f-fd83-4ac1-83d8-48e402966771';

-- 2. Check table structure and constraints
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check all constraints on the table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'customer_payments' 
  AND tc.table_schema = 'public';

-- 4. Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'customer_payments';

-- 5. Check RLS policies
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

-- 6. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'customer_payments';

-- 7. Test a minimal update to isolate the issue
UPDATE customer_payments 
SET updated_at = NOW()
WHERE id = '4786304f-fd83-4ac1-83d8-48e402966771';

-- 8. If that works, test with status
UPDATE customer_payments 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = '4786304f-fd83-4ac1-83d8-48e402966771';

-- 9. Check the final state
SELECT 
  id,
  amount,
  method,
  status,
  updated_at
FROM customer_payments 
WHERE id = '4786304f-fd83-4ac1-83d8-48e402966771';
