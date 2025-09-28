-- Add customer validation to lats_sales table
-- This migration handles lats_sales table separately to avoid deadlocks

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
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
        
        -- Add comment
        COMMENT ON CONSTRAINT check_lats_sales_customer_id_not_empty ON lats_sales IS 'Ensures customer_id is not null or empty string';
        
    END IF;
END $$;
