-- Fix diagnostic_checks table foreign key constraint
-- This script can be run directly in Supabase SQL editor

-- Add the missing foreign key constraint to diagnostic_checks table
-- This will fix the 400 Bad Request error when querying diagnostic_requests with joins

-- First, ensure the diagnostic_checks table exists with proper structure
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

-- Add the foreign key constraint if it doesn't exist
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
    END IF;
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







