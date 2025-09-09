-- Fix column name mismatch in lats_shipping_agent_offices table
-- This ensures the column is consistently named 'is_primary'

-- Check if is_main_office column exists and rename it to is_primary
DO $$
BEGIN
    -- If is_main_office exists, rename it to is_primary
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_shipping_agent_offices' 
        AND column_name = 'is_main_office'
    ) THEN
        ALTER TABLE lats_shipping_agent_offices RENAME COLUMN is_main_office TO is_primary;
    END IF;
    
    -- If is_primary doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_shipping_agent_offices' 
        AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE lats_shipping_agent_offices ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN lats_shipping_agent_offices.is_primary IS 'Indicates if this is the primary office for the shipping agent';
