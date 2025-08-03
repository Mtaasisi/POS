-- Fix customers table to add missing columns expected by TypeScript types

-- Add missing columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location_description TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'customers'
    AND column_name IN ('location_description', 'national_id', 'created_by')
ORDER BY column_name; 