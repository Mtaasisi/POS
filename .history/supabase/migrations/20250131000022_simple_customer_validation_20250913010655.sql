-- Simple customer validation migration
-- This migration adds basic customer validation without complex logic

-- First, create a default customer if it doesn't exist
INSERT INTO customers (id, name, phone, email, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Unknown Customer',
    '0000000000',
    'unknown@example.com',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Handle customer_payments table
-- Update NULL customer_id values to default customer
UPDATE customer_payments 
SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
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
