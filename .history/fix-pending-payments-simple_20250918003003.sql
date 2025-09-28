-- =====================================================
-- SIMPLE FIX FOR PENDING PAYMENTS ISSUES
-- =====================================================
-- Run this directly in Supabase SQL Editor

-- 1. Check current pending payments
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
  created_at
FROM customer_payments 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check for missing required fields
SELECT 
  COUNT(*) as total_pending,
  COUNT(CASE WHEN currency IS NULL THEN 1 END) as missing_currency,
  COUNT(CASE WHEN payment_account_id IS NULL THEN 1 END) as missing_account_id,
  COUNT(CASE WHEN payment_method_id IS NULL THEN 1 END) as missing_method_id,
  COUNT(CASE WHEN reference IS NULL THEN 1 END) as missing_reference,
  COUNT(CASE WHEN notes IS NULL THEN 1 END) as missing_notes
FROM customer_payments 
WHERE status = 'pending';

-- 3. Update pending payments with missing required fields
UPDATE customer_payments 
SET 
  currency = COALESCE(currency, 'TZS'),
  reference = COALESCE(reference, ''),
  notes = COALESCE(notes, ''),
  updated_at = NOW()
WHERE status = 'pending' 
AND (currency IS NULL OR reference IS NULL OR notes IS NULL);

-- 4. Check for duplicate pending payments for the same device
SELECT 
  device_id,
  payment_type,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as payment_ids
FROM customer_payments 
WHERE status = 'pending' 
AND device_id IS NOT NULL
GROUP BY device_id, payment_type
HAVING COUNT(*) > 1;

-- 5. Check for orphaned pending payments
SELECT 
  COUNT(*) as orphaned_payments
FROM customer_payments 
WHERE status = 'pending' 
AND (device_id IS NULL OR customer_id IS NULL);

-- 6. Final verification
SELECT 
  'Pending payments fix applied successfully' as status,
  COUNT(*) as total_pending_payments,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as with_currency,
  COUNT(CASE WHEN payment_account_id IS NOT NULL THEN 1 END) as with_account_id,
  COUNT(CASE WHEN payment_method_id IS NOT NULL THEN 1 END) as with_method_id
FROM customer_payments 
WHERE status = 'pending';
