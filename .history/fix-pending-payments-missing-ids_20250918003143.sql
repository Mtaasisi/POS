-- =====================================================
-- FIX MISSING PAYMENT ACCOUNT AND METHOD IDs
-- =====================================================
-- This fixes pending payments that are missing payment_account_id and payment_method_id

-- 1. Check available finance accounts
SELECT 
  id,
  name,
  currency,
  balance,
  is_active
FROM finance_accounts 
WHERE is_active = true
ORDER BY name;

-- 2. Check available payment methods
SELECT 
  id,
  name,
  is_active
FROM payment_methods 
WHERE is_active = true
ORDER BY name;

-- 3. Get default account and method IDs
WITH default_accounts AS (
  SELECT 
    id as default_account_id,
    name as account_name
  FROM finance_accounts 
  WHERE is_active = true 
  AND (name ILIKE '%cash%' OR name ILIKE '%main%' OR name ILIKE '%primary%')
  ORDER BY 
    CASE 
      WHEN name ILIKE '%cash%' THEN 1
      WHEN name ILIKE '%main%' THEN 2
      WHEN name ILIKE '%primary%' THEN 3
      ELSE 4
    END
  LIMIT 1
),
default_methods AS (
  SELECT 
    id as default_method_id,
    name as method_name
  FROM payment_methods 
  WHERE is_active = true 
  AND (name ILIKE '%cash%' OR name ILIKE '%manual%' OR name ILIKE '%default%')
  ORDER BY 
    CASE 
      WHEN name ILIKE '%cash%' THEN 1
      WHEN name ILIKE '%manual%' THEN 2
      WHEN name ILIKE '%default%' THEN 3
      ELSE 4
    END
  LIMIT 1
)
SELECT 
  da.default_account_id,
  da.account_name,
  dm.default_method_id,
  dm.method_name
FROM default_accounts da
CROSS JOIN default_methods dm;

-- 4. Update pending payments with default account and method IDs
-- First, let's see what we're updating
SELECT 
  cp.id,
  cp.amount,
  cp.method,
  cp.payment_type,
  cp.currency,
  cp.payment_account_id,
  cp.payment_method_id
FROM customer_payments cp
WHERE cp.status = 'pending'
AND (cp.payment_account_id IS NULL OR cp.payment_method_id IS NULL);

-- 5. Update with default values (using the first available account and method)
UPDATE customer_payments 
SET 
  payment_account_id = (
    SELECT id 
    FROM finance_accounts 
    WHERE is_active = true 
    ORDER BY 
      CASE 
        WHEN name ILIKE '%cash%' THEN 1
        WHEN name ILIKE '%main%' THEN 2
        WHEN name ILIKE '%primary%' THEN 3
        ELSE 4
      END,
      name
    LIMIT 1
  ),
  payment_method_id = (
    SELECT id 
    FROM payment_methods 
    WHERE is_active = true 
    ORDER BY 
      CASE 
        WHEN name ILIKE '%cash%' THEN 1
        WHEN name ILIKE '%manual%' THEN 2
        WHEN name ILIKE '%default%' THEN 3
        ELSE 4
      END,
      name
    LIMIT 1
  ),
  updated_at = NOW()
WHERE status = 'pending'
AND (payment_account_id IS NULL OR payment_method_id IS NULL);

-- 6. Verify the update
SELECT 
  'Pending payments updated successfully' as status,
  COUNT(*) as total_pending_payments,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as with_currency,
  COUNT(CASE WHEN payment_account_id IS NOT NULL THEN 1 END) as with_account_id,
  COUNT(CASE WHEN payment_method_id IS NOT NULL THEN 1 END) as with_method_id
FROM customer_payments 
WHERE status = 'pending';

-- 7. Show updated pending payments
SELECT 
  cp.id,
  cp.amount,
  cp.method,
  cp.payment_type,
  cp.currency,
  cp.payment_account_id,
  cp.payment_method_id,
  fa.name as account_name,
  pm.name as method_name
FROM customer_payments cp
LEFT JOIN finance_accounts fa ON cp.payment_account_id = fa.id
LEFT JOIN payment_methods pm ON cp.payment_method_id = pm.id
WHERE cp.status = 'pending'
ORDER BY cp.created_at DESC;
