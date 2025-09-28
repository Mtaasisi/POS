-- =====================================================
-- FIX PENDING PAYMENTS ISSUES FOR REPAIR PARTS
-- =====================================================
-- This addresses common issues with pending payments

-- 1. Check current customer_payments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
ORDER BY ordinal_position;

-- 2. Check current pending payments
SELECT 
  id,
  customer_id,
  device_id,
  amount,
  method,
  payment_type,
  status,
  payment_date,
  created_at,
  updated_at,
  currency,
  payment_account_id,
  payment_method_id,
  reference,
  notes
FROM customer_payments 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check for missing required fields in pending payments
SELECT 
  COUNT(*) as total_pending,
  COUNT(CASE WHEN currency IS NULL THEN 1 END) as missing_currency,
  COUNT(CASE WHEN payment_account_id IS NULL THEN 1 END) as missing_account_id,
  COUNT(CASE WHEN payment_method_id IS NULL THEN 1 END) as missing_method_id,
  COUNT(CASE WHEN reference IS NULL THEN 1 END) as missing_reference,
  COUNT(CASE WHEN notes IS NULL THEN 1 END) as missing_notes
FROM customer_payments 
WHERE status = 'pending';

-- 4. Update pending payments with missing required fields
UPDATE customer_payments 
SET 
  currency = COALESCE(currency, 'TZS'),
  reference = COALESCE(reference, ''),
  notes = COALESCE(notes, ''),
  updated_at = NOW()
WHERE status = 'pending' 
AND (currency IS NULL OR reference IS NULL OR notes IS NULL);

-- 5. Check for orphaned pending payments (no device or customer)
SELECT 
  COUNT(*) as orphaned_payments
FROM customer_payments 
WHERE status = 'pending' 
AND (device_id IS NULL OR customer_id IS NULL);

-- 6. Check for duplicate pending payments for the same device
SELECT 
  device_id,
  payment_type,
  COUNT(*) as duplicate_count
FROM customer_payments 
WHERE status = 'pending' 
AND device_id IS NOT NULL
GROUP BY device_id, payment_type
HAVING COUNT(*) > 1;

-- 7. Create a function to safely process pending payments
CREATE OR REPLACE FUNCTION process_pending_payment(
  payment_id_param UUID,
  payment_account_id_param UUID,
  payment_method_id_param UUID,
  user_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  payment_record RECORD;
  result JSONB;
BEGIN
  -- Get the payment record
  SELECT * INTO payment_record
  FROM customer_payments 
  WHERE id = payment_id_param AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pending payment not found'
    );
  END IF;
  
  -- Update the payment with required fields
  UPDATE customer_payments 
  SET 
    status = 'completed',
    payment_account_id = payment_account_id_param,
    payment_method_id = payment_method_id_param,
    currency = COALESCE(currency, 'TZS'),
    reference = COALESCE(reference, ''),
    notes = COALESCE(notes, ''),
    updated_at = NOW(),
    updated_by = user_id_param
  WHERE id = payment_id_param;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Payment processed successfully',
    'payment_id', payment_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Grant permissions on the function
GRANT EXECUTE ON FUNCTION process_pending_payment TO authenticated;
GRANT EXECUTE ON FUNCTION process_pending_payment TO service_role;

-- 9. Create a view for pending payments with all required info
CREATE OR REPLACE VIEW pending_payments_view AS
SELECT 
  cp.id,
  cp.customer_id,
  cp.device_id,
  cp.amount,
  cp.method,
  cp.payment_type,
  cp.status,
  cp.payment_date,
  cp.currency,
  cp.payment_account_id,
  cp.payment_method_id,
  cp.reference,
  cp.notes,
  cp.created_at,
  cp.updated_at,
  c.name as customer_name,
  d.brand as device_brand,
  d.model as device_model,
  fa.name as account_name,
  pm.name as method_name
FROM customer_payments cp
LEFT JOIN customers c ON cp.customer_id = c.id
LEFT JOIN devices d ON cp.device_id = d.id
LEFT JOIN finance_accounts fa ON cp.payment_account_id = fa.id
LEFT JOIN payment_methods pm ON cp.payment_method_id = pm.id
WHERE cp.status = 'pending';

-- 10. Grant permissions on the view
GRANT SELECT ON pending_payments_view TO authenticated;
GRANT SELECT ON pending_payments_view TO service_role;

-- 11. Test the view
SELECT * FROM pending_payments_view LIMIT 5;

-- 12. Check for any constraint violations
SELECT 
  'customer_payments' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM customer_payments;

-- 13. Final verification
SELECT 
  'Pending payments fix applied successfully' as status,
  COUNT(*) as total_pending_payments,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as with_currency,
  COUNT(CASE WHEN payment_account_id IS NOT NULL THEN 1 END) as with_account_id,
  COUNT(CASE WHEN payment_method_id IS NOT NULL THEN 1 END) as with_method_id
FROM customer_payments 
WHERE status = 'pending';
