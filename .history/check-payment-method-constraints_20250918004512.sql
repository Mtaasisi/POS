-- =====================================================
-- CHECK PAYMENT METHOD CONSTRAINTS
-- =====================================================
-- This checks what values are allowed for the method field

-- 1. Check the current payment that's failing
SELECT 
  id,
  amount,
  method,
  payment_type,
  status,
  currency,
  payment_account_id,
  payment_method_id
FROM customer_payments 
WHERE id = '7722e979-4725-46f1-bac0-3bf35058ea98';

-- 2. Check what constraints exist on the method column
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customer_payments'::regclass 
AND pg_get_constraintdef(oid) ILIKE '%method%';

-- 3. Check if there's a check constraint on method values
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customer_payments'::regclass 
AND contype = 'c'
AND pg_get_constraintdef(oid) ILIKE '%method%';

-- 4. Check what method values are currently in the database
SELECT 
  method,
  COUNT(*) as count
FROM customer_payments 
GROUP BY method
ORDER BY count DESC;

-- 5. Check if 'CRDB' is a valid method value
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM customer_payments WHERE method = 'CRDB') 
    THEN 'CRDB exists in database'
    ELSE 'CRDB does not exist in database'
  END as crdb_status;

-- 6. Try to update with a simple method value
UPDATE customer_payments 
SET 
  method = 'cash',
  status = 'completed',
  updated_at = NOW()
WHERE id = '7722e979-4725-46f1-bac0-3bf35058ea98'
RETURNING id, method, status, updated_at;
