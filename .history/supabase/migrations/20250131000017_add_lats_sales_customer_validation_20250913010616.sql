-- Add customer validation to lats_sales table
-- This migration handles lats_sales table separately to avoid deadlocks

-- Check if lats_sales table exists and has customer_id column
DO $$ 
BEGIN
    -- Only proceed if the table and column exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lats_sales' AND column_name = 'customer_id') THEN
        
        -- Handle NULL customer_id values based on column type
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_sales' 
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
            UPDATE lats_sales 
            SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
            WHERE customer_id IS NULL;
            
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'lats_sales' 
                      AND column_name = 'customer_id' 
                      AND data_type = 'text') THEN
            
            -- For text columns, update with default value
            UPDATE lats_sales 
            SET customer_id = 'unknown_customer_' || id::text 
            WHERE customer_id IS NULL;
            
        END IF;
        
        -- Add NOT NULL constraint
        ALTER TABLE lats_sales 
        ALTER COLUMN customer_id SET NOT NULL;
        
        -- Add check constraint
        ALTER TABLE lats_sales 
        ADD CONSTRAINT check_lats_sales_customer_id_not_empty 
        CHECK (customer_id IS NOT NULL AND customer_id != '');
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
        
        -- Add comment
        COMMENT ON CONSTRAINT check_lats_sales_customer_id_not_empty ON lats_sales IS 'Ensures customer_id is not null or empty string';
        
    END IF;
END $$;