-- Safe customer validation constraints migration
-- This migration adds NOT NULL constraints step by step to avoid deadlocks

-- Step 1: Handle customer_payments table first
-- Check if customer_id is UUID type and handle accordingly
DO $$ 
BEGIN
    -- Check if customer_id column exists and is UUID type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customer_payments' 
               AND column_name = 'customer_id' 
               AND data_type = 'uuid') THEN
        
        -- For UUID columns, set NULL values to default customer
        -- First ensure default customer exists
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
        
        -- Update NULL customer_id values to default customer
        UPDATE customer_payments 
        SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
        WHERE customer_id IS NULL;
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'customer_payments' 
                  AND column_name = 'customer_id' 
                  AND data_type = 'text') THEN
        
        -- For text columns, use the original approach
        UPDATE customer_payments 
        SET customer_id = 'unknown_customer_' || id::text 
        WHERE customer_id IS NULL;
        
    END IF;
END $$;

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