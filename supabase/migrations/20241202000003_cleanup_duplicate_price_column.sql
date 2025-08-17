-- Migration: Remove duplicate price column from lats_sale_items table
-- The table has both 'unit_price' and 'price' columns, we should use 'unit_price'

-- Drop the duplicate price column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'price'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE lats_sale_items DROP COLUMN price;
        RAISE NOTICE 'Duplicate price column removed from lats_sale_items table';
    ELSE
        RAISE NOTICE 'Price column does not exist, no action needed';
    END IF;
END $$;

-- Verify the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
