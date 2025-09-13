-- Add customer validation to lats_sales table
-- This migration handles lats_sales table with proper UUID handling

-- Only proceed if lats_sales table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN
        
        -- Update NULL customer_id values to default customer (empty strings already handled)
        UPDATE lats_sales 
        SET customer_id = '00000000-0000-0000-0000-000000000000'::uuid
        WHERE customer_id IS NULL;
        
        -- Add NOT NULL constraint to lats_sales
        ALTER TABLE lats_sales 
        ALTER COLUMN customer_id SET NOT NULL;
        
        -- For UUID columns, we only need to check NOT NULL (UUIDs can't be empty strings)
        -- Add check constraint to lats_sales (UUID version)
        ALTER TABLE lats_sales 
        ADD CONSTRAINT check_lats_sales_customer_id_not_null 
        CHECK (customer_id IS NOT NULL);
        
        -- Create index for lats_sales
        CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
        
    END IF;
END $$;
