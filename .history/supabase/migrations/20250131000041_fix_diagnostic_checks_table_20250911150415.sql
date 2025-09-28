-- Fix diagnostic_checks table structure
-- Migration: 20250131000041_fix_diagnostic_checks_table.sql

-- Drop the existing table if it exists (this will remove any data, but since it's not working, it's safe)
DROP TABLE IF EXISTS diagnostic_checks CASCADE;

-- Recreate the diagnostic_checks table with proper structure
CREATE TABLE diagnostic_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_device_id UUID NOT NULL,
    test_item TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
    remarks TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX idx_diagnostic_checks_result ON diagnostic_checks(result);
CREATE INDEX idx_diagnostic_checks_created_at ON diagnostic_checks(created_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checks
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_checks TO authenticated;

-- Create trigger for updating timestamps (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_diagnostic_checks_updated_at 
            BEFORE UPDATE ON diagnostic_checks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_checks IS 'Stores individual diagnostic test results for each device';
COMMENT ON COLUMN diagnostic_checks.diagnostic_device_id IS 'Reference to the device being diagnosed';
COMMENT ON COLUMN diagnostic_checks.test_item IS 'Name of the diagnostic test performed';
COMMENT ON COLUMN diagnostic_checks.result IS 'Result of the test: passed or failed';
COMMENT ON COLUMN diagnostic_checks.remarks IS 'Additional notes or observations about the test';
COMMENT ON COLUMN diagnostic_checks.image_url IS 'URL to any images taken during the test';
