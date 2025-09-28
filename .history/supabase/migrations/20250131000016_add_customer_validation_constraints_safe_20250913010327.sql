-- Safe customer validation constraints migration
-- This migration adds NOT NULL constraints step by step to avoid deadlocks

-- Step 1: Handle customer_payments table first
-- Update any NULL customer_id values
UPDATE customer_payments 
SET customer_id = 'unknown_customer_' || id::text 
WHERE customer_id IS NULL;

-- Add NOT NULL constraint to customer_payments
ALTER TABLE customer_payments 
ALTER COLUMN customer_id SET NOT NULL;

-- Add check constraint to customer_payments
ALTER TABLE customer_payments 
ADD CONSTRAINT check_customer_id_not_empty 
CHECK (customer_id IS NOT NULL AND customer_id != '');

-- Create index for customer_payments
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);

-- Add comment
COMMENT ON CONSTRAINT check_customer_id_not_empty ON customer_payments IS 'Ensures customer_id is not null or empty string';
