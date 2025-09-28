-- Create diagnostic tables for the repair system
-- Migration: 20250915111544_create_diagnostic_tables.sql

-- Create diagnostic_requests table
CREATE TABLE IF NOT EXISTS diagnostic_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'submitted_for_review', 'admin_reviewed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic_devices table
CREATE TABLE IF NOT EXISTS diagnostic_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_request_id UUID NOT NULL REFERENCES diagnostic_requests(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    serial_number TEXT,
    model TEXT,
    notes TEXT,
    result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'passed', 'failed', 'partially_failed', 'submitted_for_review', 'repair_required', 'replacement_required', 'no_action_required', 'escalated', 'admin_reviewed', 'sent_to_care')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_by ON diagnostic_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_assigned_to ON diagnostic_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_status ON diagnostic_requests(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_at ON diagnostic_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_request_id ON diagnostic_devices(diagnostic_request_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_result_status ON diagnostic_devices(result_status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_created_at ON diagnostic_devices(created_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_devices ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_requests' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_requests
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_devices' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_devices
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_requests TO authenticated;
GRANT ALL ON diagnostic_devices TO authenticated;

-- Create triggers for updating timestamps (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create trigger for diagnostic_requests if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_diagnostic_requests_updated_at') THEN
            CREATE TRIGGER update_diagnostic_requests_updated_at 
                BEFORE UPDATE ON diagnostic_requests
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
        
        -- Create trigger for diagnostic_devices if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_diagnostic_devices_updated_at') THEN
            CREATE TRIGGER update_diagnostic_devices_updated_at 
                BEFORE UPDATE ON diagnostic_devices
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE diagnostic_requests IS 'Stores diagnostic requests for device testing';
COMMENT ON TABLE diagnostic_devices IS 'Stores devices associated with diagnostic requests';

COMMENT ON COLUMN diagnostic_requests.created_by IS 'User who created the diagnostic request';
COMMENT ON COLUMN diagnostic_requests.assigned_to IS 'User assigned to handle the diagnostic request';
COMMENT ON COLUMN diagnostic_requests.status IS 'Current status of the diagnostic request';

COMMENT ON COLUMN diagnostic_devices.diagnostic_request_id IS 'Reference to the diagnostic request';
COMMENT ON COLUMN diagnostic_devices.device_name IS 'Name of the device being diagnosed';
COMMENT ON COLUMN diagnostic_devices.result_status IS 'Current status of the device diagnosis';
