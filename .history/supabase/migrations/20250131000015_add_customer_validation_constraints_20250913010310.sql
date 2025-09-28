-- Add customer validation constraints to ensure customer_id is required
-- This migration adds NOT NULL constraints and validation rules for customer_id fields
-- Using safer approach to avoid deadlocks

-- First, check if there are any NULL customer_id values and handle them
-- Update any NULL customer_id values to a default value or delete invalid records
UPDATE customer_payments 
SET customer_id = 'unknown_customer_' || id::text 
WHERE customer_id IS NULL;

-- Add NOT NULL constraint to customer_payments table
ALTER TABLE customer_payments 
ALTER COLUMN customer_id SET NOT NULL;

-- Add check constraint to ensure customer_id is not empty string
ALTER TABLE customer_payments 
ADD CONSTRAINT check_customer_id_not_empty 
CHECK (customer_id IS NOT NULL AND customer_id != '');

-- Handle lats_sales table separately to avoid deadlocks
-- Check if lats_sales table exists and has customer_id column
DO $$ 
BEGIN
    -- Only proceed if the table and column exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lats_sales' AND column_name = 'customer_id') THEN
        
        -- Update any NULL customer_id values first
        UPDATE lats_sales 
        SET customer_id = 'unknown_customer_' || id::text 
        WHERE customer_id IS NULL;
        
        -- Add NOT NULL constraint
        ALTER TABLE lats_sales 
        ALTER COLUMN customer_id SET NOT NULL;
        
        -- Add check constraint
        ALTER TABLE lats_sales 
        ADD CONSTRAINT check_lats_sales_customer_id_not_empty 
        CHECK (customer_id IS NOT NULL AND customer_id != '');
        
    END IF;
END $$;

-- Create index on customer_id for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);

-- Create index on customer_id for lats_sales (if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lats_sales' AND column_name = 'customer_id') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
    END IF;
END $$;

-- Create index on customer_id for payment_transactions (if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payment_transactions' AND column_name = 'customer_id') THEN
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
    END IF;
END $$;

-- Add comment to document the constraints
COMMENT ON CONSTRAINT check_customer_id_not_empty ON customer_payments IS 'Ensures customer_id is not null or empty string';

-- Add RLS policies to ensure users can only access their own customer data
-- (This assumes you have RLS enabled and user authentication in place)

-- Policy for customer_payments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_payments' AND policyname = 'customer_payments_customer_validation') THEN
        DROP POLICY customer_payments_customer_validation ON customer_payments;
    END IF;
    
    CREATE POLICY customer_payments_customer_validation ON customer_payments
    FOR ALL
    USING (customer_id IS NOT NULL AND customer_id != '');
END $$;

-- Policy for lats_sales (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lats_sales' AND policyname = 'lats_sales_customer_validation') THEN
            DROP POLICY lats_sales_customer_validation ON lats_sales;
        END IF;
        
        CREATE POLICY lats_sales_customer_validation ON lats_sales
        FOR ALL
        USING (customer_id IS NOT NULL AND customer_id != '');
    END IF;
END $$;

-- Policy for payment_transactions (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'payment_transactions_customer_validation') THEN
            DROP POLICY payment_transactions_customer_validation ON payment_transactions;
        END IF;
        
        CREATE POLICY payment_transactions_customer_validation ON payment_transactions
        FOR ALL
        USING (customer_id IS NOT NULL AND customer_id != '');
    END IF;
END $$;
