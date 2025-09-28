-- Add customer validation to payment_transactions table
-- This migration handles payment_transactions table separately to avoid deadlocks

-- Check if payment_transactions table exists and has customer_id column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payment_transactions' AND column_name = 'customer_id') THEN
        
        -- Update any NULL customer_id values first
        UPDATE payment_transactions 
        SET customer_id = 'unknown_customer_' || id::text 
        WHERE customer_id IS NULL;
        
        -- Add NOT NULL constraint
        ALTER TABLE payment_transactions 
        ALTER COLUMN customer_id SET NOT NULL;
        
        -- Add check constraint
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT check_payment_transactions_customer_id_not_empty 
        CHECK (customer_id IS NOT NULL AND customer_id != '');
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
        
        -- Add comment
        COMMENT ON CONSTRAINT check_payment_transactions_customer_id_not_empty ON payment_transactions IS 'Ensures customer_id is not null or empty string';
        
    END IF;
END $$;
