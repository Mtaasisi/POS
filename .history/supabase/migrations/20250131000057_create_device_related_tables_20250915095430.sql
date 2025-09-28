-- Create device-related tables that are referenced in the application code
-- Migration: 20250131000057_create_device_related_tables.sql

-- Create device_remarks table
CREATE TABLE IF NOT EXISTS device_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_transitions table
CREATE TABLE IF NOT EXISTS device_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    performed_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_ratings table
CREATE TABLE IF NOT EXISTS device_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_remarks_device_id ON device_remarks(device_id);
CREATE INDEX IF NOT EXISTS idx_device_remarks_created_by ON device_remarks(created_by);
CREATE INDEX IF NOT EXISTS idx_device_remarks_created_at ON device_remarks(created_at);

CREATE INDEX IF NOT EXISTS idx_device_transitions_device_id ON device_transitions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_transitions_to_status ON device_transitions(to_status);
CREATE INDEX IF NOT EXISTS idx_device_transitions_performed_by ON device_transitions(performed_by);
CREATE INDEX IF NOT EXISTS idx_device_transitions_created_at ON device_transitions(created_at);

CREATE INDEX IF NOT EXISTS idx_device_ratings_device_id ON device_ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_ratings_technician_id ON device_ratings(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_ratings_score ON device_ratings(score);
CREATE INDEX IF NOT EXISTS idx_device_ratings_created_at ON device_ratings(created_at);

-- Enable Row Level Security
ALTER TABLE device_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ratings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables
CREATE POLICY "Enable all access for authenticated users" ON device_remarks
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON device_transitions
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON device_ratings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON device_remarks TO authenticated;
GRANT ALL ON device_remarks TO anon;

GRANT ALL ON device_transitions TO authenticated;
GRANT ALL ON device_transitions TO anon;

GRANT ALL ON device_ratings TO authenticated;
GRANT ALL ON device_ratings TO anon;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_device_remarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_device_remarks_updated_at ON device_remarks;
CREATE TRIGGER trigger_update_device_remarks_updated_at
    BEFORE UPDATE ON device_remarks
    FOR EACH ROW
    EXECUTE FUNCTION update_device_remarks_updated_at();

-- Add comments for documentation
COMMENT ON TABLE device_remarks IS 'Remarks and notes for devices';
COMMENT ON TABLE device_transitions IS 'Status transition history for devices';
COMMENT ON TABLE device_ratings IS 'Ratings and feedback for device repairs';

-- Verification
DO $$
DECLARE
    remarks_exists BOOLEAN;
    transitions_exists BOOLEAN;
    ratings_exists BOOLEAN;
BEGIN
    -- Check if device_remarks table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_remarks'
    ) INTO remarks_exists;
    
    -- Check if device_transitions table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_transitions'
    ) INTO transitions_exists;
    
    -- Check if device_ratings table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_ratings'
    ) INTO ratings_exists;
    
    -- Report results
    IF remarks_exists THEN
        RAISE NOTICE '✅ device_remarks table exists';
    ELSE
        RAISE NOTICE '❌ device_remarks table missing';
    END IF;
    
    IF transitions_exists THEN
        RAISE NOTICE '✅ device_transitions table exists';
    ELSE
        RAISE NOTICE '❌ device_transitions table missing';
    END IF;
    
    IF ratings_exists THEN
        RAISE NOTICE '✅ device_ratings table exists';
    ELSE
        RAISE NOTICE '❌ device_ratings table missing';
    END IF;
    
    RAISE NOTICE '✅ All device-related tables should now be available!';
END $$;
