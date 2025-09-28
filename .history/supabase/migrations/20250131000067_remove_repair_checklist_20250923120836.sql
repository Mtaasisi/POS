-- Remove repair_checklist column from devices table
-- This migration removes the repair_checklist functionality completely

BEGIN;

-- Drop the repair_checklist column from devices table
DO $$
BEGIN
    -- Check if the column exists before dropping it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'repair_checklist'
    ) THEN
        -- Drop the column
        ALTER TABLE devices DROP COLUMN repair_checklist;
        RAISE NOTICE 'Successfully dropped repair_checklist column from devices table';
    ELSE
        RAISE NOTICE 'repair_checklist column does not exist in devices table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping repair_checklist column: %', SQLERRM;
END $$;

COMMIT;
