-- Add diagnostic_checklist column to devices table
-- Migration: 20250131000037_add_diagnostic_checklist_column.sql

-- Add diagnostic_checklist column as JSONB to store diagnostic results
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS diagnostic_checklist JSONB DEFAULT NULL;

-- Add repair_checklist column as JSONB to store repair checklist data
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_checklist JSONB DEFAULT NULL;

-- Create index for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_devices_diagnostic_checklist ON devices USING GIN (diagnostic_checklist);
CREATE INDEX IF NOT EXISTS idx_devices_repair_checklist ON devices USING GIN (repair_checklist);

-- Add comments for documentation
COMMENT ON COLUMN devices.diagnostic_checklist IS 'Stores diagnostic checklist results including items, notes, summary, and overall status';
COMMENT ON COLUMN devices.repair_checklist IS 'Stores repair checklist progress including items, notes, and completion status';

-- Verification
DO $$
DECLARE
    diagnostic_column_exists BOOLEAN;
    repair_column_exists BOOLEAN;
BEGIN
    -- Check if diagnostic_checklist column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'diagnostic_checklist'
    ) INTO diagnostic_column_exists;
    
    -- Check if repair_checklist column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'repair_checklist'
    ) INTO repair_column_exists;
    
    IF diagnostic_column_exists AND repair_column_exists THEN
        RAISE NOTICE '✅ diagnostic_checklist and repair_checklist columns added successfully!';
        RAISE NOTICE '✅ Device PATCH requests should now work for diagnostic and repair data!';
    ELSE
        RAISE NOTICE '❌ Failed to add checklist columns';
        RAISE NOTICE 'diagnostic_checklist exists: %', diagnostic_column_exists;
        RAISE NOTICE 'repair_checklist exists: %', repair_column_exists;
    END IF;
END $$;
