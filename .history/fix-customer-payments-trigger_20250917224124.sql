-- Fix customer_payments update trigger conflict
-- The issue is likely that both the frontend and trigger are updating updated_at

-- 1. Ensure the update trigger exists and works properly
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;

CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Test the trigger by updating without manually setting updated_at
UPDATE customer_payments 
SET 
  status = 'completed',
  amount = 543554.00,
  method = 'cash'
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- 4. Verify the trigger updated the timestamp automatically
SELECT 
  id,
  amount,
  method,
  status,
  updated_at,
  created_at
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';

-- 5. Check if the trigger is working by comparing timestamps
SELECT 
  id,
  updated_at,
  created_at,
  (updated_at > created_at) as trigger_working
FROM customer_payments 
WHERE id = '01b26848-e830-4305-b332-7498d7f73fef';
