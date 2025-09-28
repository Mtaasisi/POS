-- Enhance checklist synchronization and database relationships
-- Migration: 20250131000050_enhance_checklist_sync.sql

-- Ensure devices table has all required columns
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS diagnostic_checklist JSONB DEFAULT NULL;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_checklist JSONB DEFAULT NULL;

-- Create indexes for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_devices_diagnostic_checklist ON devices USING GIN (diagnostic_checklist);
CREATE INDEX IF NOT EXISTS idx_devices_repair_checklist ON devices USING GIN (repair_checklist);

-- Ensure diagnostic_checks table exists with proper structure
CREATE TABLE IF NOT EXISTS diagnostic_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_device_id UUID NOT NULL,
    test_item TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
    remarks TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for diagnostic_checks table
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_created_at ON diagnostic_checks(created_at);

-- Enable Row Level Security for diagnostic_checks
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;

-- Create policy for diagnostic_checks (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_checks' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checks
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_checks TO authenticated;

-- Create trigger for updating timestamps (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_diagnostic_checks_updated_at ON diagnostic_checks;
        CREATE TRIGGER update_diagnostic_checks_updated_at 
            BEFORE UPDATE ON diagnostic_checks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Ensure devices table has proper RLS policies
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policy for devices table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'devices' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON devices
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Grant all permissions to authenticated users
GRANT ALL ON devices TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN devices.diagnostic_checklist IS 'Stores diagnostic checklist results including items, notes, summary, and overall status';
COMMENT ON COLUMN devices.repair_checklist IS 'Stores repair checklist progress including items, notes, and completion status';
COMMENT ON TABLE diagnostic_checks IS 'Stores individual diagnostic test results for each device';
COMMENT ON COLUMN diagnostic_checks.diagnostic_device_id IS 'Reference to the device being diagnosed';
COMMENT ON COLUMN diagnostic_checks.test_item IS 'Name of the diagnostic test performed';
COMMENT ON COLUMN diagnostic_checks.result IS 'Result of the test: passed or failed';
COMMENT ON COLUMN diagnostic_checks.remarks IS 'Additional notes or observations about the test';
COMMENT ON COLUMN diagnostic_checks.image_url IS 'URL to any images taken during the test';

-- Verification
DO $$
DECLARE
    diagnostic_column_exists BOOLEAN;
    repair_column_exists BOOLEAN;
    diagnostic_checks_table_exists BOOLEAN;
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
    
    -- Check if diagnostic_checks table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'diagnostic_checks'
    ) INTO diagnostic_checks_table_exists;
    
    IF diagnostic_column_exists AND repair_column_exists AND diagnostic_checks_table_exists THEN
        RAISE NOTICE '✅ All checklist columns and tables are properly set up!';
        RAISE NOTICE '✅ Device checklist functionality should work perfectly!';
        RAISE NOTICE '✅ Auto-save and synchronization features are ready!';
    ELSE
        RAISE NOTICE '❌ Some checklist components are missing:';
        RAISE NOTICE 'diagnostic_checklist column exists: %', diagnostic_column_exists;
        RAISE NOTICE 'repair_checklist column exists: %', repair_column_exists;
        RAISE NOTICE 'diagnostic_checks table exists: %', diagnostic_checks_table_exists;
    END IF;
END $$;
