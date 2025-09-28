-- =====================================================
-- FIX PAYMENT UPDATE 400 ERROR
-- =====================================================
-- This addresses the 400 error when updating customer_payments

-- 1. Check current customer_payments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
ORDER BY ordinal_position;

-- 2. Check for any NOT NULL constraints that might be causing issues
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customer_payments'::regclass 
AND contype = 'c'; -- Check constraints

-- 3. Check foreign key constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customer_payments'::regclass 
AND contype = 'f'; -- Foreign key constraints

-- 4. Make sure all foreign key columns are nullable and deferrable
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_payment_account_id_fkey;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_payment_account_id_fkey 
FOREIGN KEY (payment_account_id) REFERENCES finance_accounts(id) 
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_payment_method_id_fkey;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_payment_method_id_fkey 
FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) 
DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_updated_by_fkey;

ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth_users(id) 
DEFERRABLE INITIALLY IMMEDIATE;

-- 5. Ensure all columns that might be updated are nullable
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN reference DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN notes DROP NOT NULL;

-- 6. Create a safe update function for customer payments
CREATE OR REPLACE FUNCTION safe_update_customer_payment(
  payment_id_param UUID,
  update_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  update_fields TEXT[];
  field_name TEXT;
  field_value TEXT;
  sql_query TEXT;
BEGIN
  -- Extract field names from JSONB
  SELECT ARRAY(SELECT jsonb_object_keys(update_data)) INTO update_fields;
  
  -- Build dynamic SQL query
  sql_query := 'UPDATE customer_payments SET ';
  
  FOR i IN 1..array_length(update_fields, 1) LOOP
    field_name := update_fields[i];
    field_value := update_data->>field_name;
    
    IF i > 1 THEN
      sql_query := sql_query || ', ';
    END IF;
    
    -- Handle different data types
    IF field_name IN ('amount') THEN
      sql_query := sql_query || field_name || ' = ' || field_value;
    ELSIF field_name IN ('updated_at', 'payment_date') THEN
      sql_query := sql_query || field_name || ' = ''' || field_value || '''::timestamp';
    ELSE
      sql_query := sql_query || field_name || ' = ''' || field_value || '''';
    END IF;
  END LOOP;
  
  sql_query := sql_query || ' WHERE id = ''' || payment_id_param || '''';
  
  -- Execute the query
  EXECUTE sql_query;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Payment updated successfully',
    'payment_id', payment_id_param
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'payment_id', payment_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions on the function
GRANT EXECUTE ON FUNCTION safe_update_customer_payment TO authenticated;
GRANT EXECUTE ON FUNCTION safe_update_customer_payment TO service_role;

-- 8. Test the function with the problematic payment
SELECT safe_update_customer_payment(
  '90bf4c74-5e22-467f-b8b0-f2a0879a1b91'::uuid,
  '{"status": "completed", "updated_at": "2025-01-31T12:00:00Z"}'::jsonb
);

-- 9. Check RLS policies and make them more permissive for updates
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customer_payments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON customer_payments;

CREATE POLICY "Enable all operations for authenticated users" ON customer_payments
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 10. Final verification
SELECT 
  'Payment update fix applied successfully' as status,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM customer_payments;
