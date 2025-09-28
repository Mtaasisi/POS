-- Add customer validation to payment_transactions table
-- This migration handles payment_transactions table with proper UUID handling

-- Only proceed if payment_transactions table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        
        -- Update NULL customer_id values to default customer
        UPDATE payment_transactions 
        SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
        WHERE customer_id IS NULL;
        
        -- Add NOT NULL constraint to payment_transactions
        ALTER TABLE payment_transactions 
        ALTER COLUMN customer_id SET NOT NULL;
        
        -- For UUID columns, we only need to check NOT NULL (UUIDs can't be empty strings)
        -- Add check constraint to payment_transactions (UUID version)
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT check_payment_transactions_customer_id_not_null 
        CHECK (customer_id IS NOT NULL);
        
        -- Create index for payment_transactions
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
        
    END IF;
END $$;
