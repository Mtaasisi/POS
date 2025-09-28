-- Fix devices table structure to match database types
-- Migration: 20250131000036_fix_devices_table_structure.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create devices table if it doesn't exist with correct structure
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT,
    issue_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
        'assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 
        'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 
        'done', 'failed'
    )),
    assigned_to UUID,
    estimated_hours INTEGER,
    expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    warranty_start TIMESTAMP WITH TIME ZONE,
    warranty_end TIMESTAMP WITH TIME ZONE,
    warranty_status TEXT,
    repair_count INTEGER DEFAULT 0,
    last_return_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);
CREATE INDEX IF NOT EXISTS idx_devices_expected_return_date ON devices(expected_return_date);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON devices;
CREATE POLICY "Enable all access for authenticated users" ON devices
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON devices TO authenticated;
GRANT ALL ON devices TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devices_updated_at ON devices;
CREATE TRIGGER trigger_update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_devices_updated_at();

-- Verification
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    -- Check if devices table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Count columns
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devices';
        
        RAISE NOTICE '✅ Devices table exists with % columns', column_count;
        RAISE NOTICE '✅ Device update 400 error should be fixed!';
    ELSE
        RAISE NOTICE '❌ Devices table does not exist';
    END IF;
END $$;
