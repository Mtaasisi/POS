-- Fix empty strings in UUID columns before adding constraints
-- This migration handles existing empty string values in UUID columns

-- First, create default customer if it doesn't exist
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
-- Update NULL and empty string customer_id values to default customer
UPDATE customer_payments 
SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE customer_id IS NULL OR customer_id = '';

-- Handle lats_sales table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN
        UPDATE lats_sales 
        SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
        WHERE customer_id IS NULL OR customer_id = '';
    END IF;
END $$;

-- Handle payment_transactions table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        UPDATE payment_transactions 
        SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
        WHERE customer_id IS NULL OR customer_id = '';
    END IF;
END $$;
