-- Create diagnostic_checks table for individual diagnostic test results
-- Migration: 20250131000040_create_diagnostic_checks_table.sql

-- Create diagnostic_checks table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_created_at ON diagnostic_checks(created_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checks
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_checks TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_diagnostic_checks_updated_at 
    BEFORE UPDATE ON diagnostic_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE diagnostic_checks IS 'Stores individual diagnostic test results for each device';
COMMENT ON COLUMN diagnostic_checks.diagnostic_device_id IS 'Reference to the device being diagnosed';
COMMENT ON COLUMN diagnostic_checks.test_item IS 'Name of the diagnostic test performed';
COMMENT ON COLUMN diagnostic_checks.result IS 'Result of the test: passed or failed';
COMMENT ON COLUMN diagnostic_checks.remarks IS 'Additional notes or observations about the test';
COMMENT ON COLUMN diagnostic_checks.image_url IS 'URL to any images taken during the test';
