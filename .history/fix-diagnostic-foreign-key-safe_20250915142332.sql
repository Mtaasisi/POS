-- Safe fix for diagnostic_checks table foreign key constraint
-- This script creates missing diagnostic_devices records instead of deleting data

-- First, let's see what orphaned records exist
SELECT 
    'Orphaned diagnostic_checks records:' as info,
    COUNT(*) as count
FROM diagnostic_checks dc
LEFT JOIN diagnostic_devices dd ON dc.diagnostic_device_id = dd.id
WHERE dd.id IS NULL;

-- Create missing diagnostic_devices records for orphaned diagnostic_checks
-- This preserves the data instead of deleting it
INSERT INTO diagnostic_devices (
    id,
    diagnostic_request_id,
    device_name,
    serial_number,
    model,
    notes,
    result_status,
    created_at,
    updated_at
)
SELECT DISTINCT
    dc.diagnostic_device_id as id,
    NULL as diagnostic_request_id, -- We don't know which request this belongs to
    COALESCE(dc.test_item, 'Unknown Device') as device_name,
    NULL as serial_number,
    NULL as model,
    'Created to fix orphaned diagnostic_checks record' as notes,
    'pending' as result_status,
    COALESCE(dc.created_at, NOW()) as created_at,
    COALESCE(dc.updated_at, NOW()) as updated_at
FROM diagnostic_checks dc
LEFT JOIN diagnostic_devices dd ON dc.diagnostic_device_id = dd.id
WHERE dd.id IS NULL
ON CONFLICT (id) DO NOTHING; -- Don't overwrite if device already exists

-- Now let's ensure the diagnostic_checks table exists with proper structure
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

-- Add the foreign key constraint now that all records should be valid
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checks_diagnostic_device_id_fkey' 
        AND table_name = 'diagnostic_checks'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE diagnostic_checks 
        ADD CONSTRAINT diagnostic_checks_diagnostic_device_id_fkey 
        FOREIGN KEY (diagnostic_device_id) 
        REFERENCES diagnostic_devices(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key constraint: %', SQLERRM;
        -- If there are still orphaned records, let's see what they are
        RAISE NOTICE 'Checking for remaining orphaned records...';
END $$;

-- Ensure indexes exist for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_created_at ON diagnostic_checks(created_at);

-- Enable Row Level Security if not already enabled
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users (only if it doesn't exist)
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
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_diagnostic_checks_updated_at ON diagnostic_checks;
        
        -- Create the trigger
        CREATE TRIGGER update_diagnostic_checks_updated_at 
            BEFORE UPDATE ON diagnostic_checks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_checks IS 'Stores individual diagnostic test results for each device';
COMMENT ON COLUMN diagnostic_checks.diagnostic_device_id IS 'Reference to the device being diagnosed (foreign key to diagnostic_devices.id)';
COMMENT ON COLUMN diagnostic_checks.test_item IS 'Name of the diagnostic test performed';
COMMENT ON COLUMN diagnostic_checks.result IS 'Result of the test: passed or failed';
COMMENT ON COLUMN diagnostic_checks.remarks IS 'Additional notes or observations about the test';
COMMENT ON COLUMN diagnostic_checks.image_url IS 'URL to any images taken during the test';

-- Final verification
SELECT 
    'Final verification:' as info,
    COUNT(*) as total_diagnostic_checks,
    COUNT(CASE WHEN dd.id IS NOT NULL THEN 1 END) as valid_records,
    COUNT(CASE WHEN dd.id IS NULL THEN 1 END) as remaining_orphaned_records
FROM diagnostic_checks dc
LEFT JOIN diagnostic_devices dd ON dc.diagnostic_device_id = dd.id;
