-- Add customer validation to customer_payments table
-- This migration handles customer_payments table with proper UUID handling

-- Update NULL customer_id values to default customer
UPDATE customer_payments 
SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE customer_id IS NULL;

-- Add NOT NULL constraint to customer_payments
ALTER TABLE customer_payments 
ALTER COLUMN customer_id SET NOT NULL;

-- For UUID columns, we only need to check NOT NULL (UUIDs can't be empty strings)
-- Add check constraint to customer_payments (UUID version)
ALTER TABLE customer_payments 
ADD CONSTRAINT check_customer_payments_customer_id_not_null 
CHECK (customer_id IS NOT NULL);

-- Create index for customer_payments
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
