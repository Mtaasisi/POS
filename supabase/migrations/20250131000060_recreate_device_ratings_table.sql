-- Recreate device_ratings table with correct structure
-- Migration: 20250131000060_recreate_device_ratings_table.sql

-- Drop the existing device_ratings table if it exists
DROP TABLE IF EXISTS device_ratings CASCADE;

-- Recreate device_ratings table with correct structure
CREATE TABLE device_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_device_ratings_device_id ON device_ratings(device_id);
CREATE INDEX idx_device_ratings_technician_id ON device_ratings(technician_id);
CREATE INDEX idx_device_ratings_score ON device_ratings(score);
CREATE INDEX idx_device_ratings_created_at ON device_ratings(created_at);

-- Enable Row Level Security
ALTER TABLE device_ratings ENABLE ROW LEVEL SECURITY;

-- Create permissive policy
CREATE POLICY "Enable all access for authenticated users" ON device_ratings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON device_ratings TO authenticated;
GRANT ALL ON device_ratings TO anon;

-- Add comments for documentation
COMMENT ON TABLE device_ratings IS 'Ratings and feedback for device repairs';
COMMENT ON COLUMN device_ratings.score IS 'Rating score from 1 to 5 stars';
COMMENT ON COLUMN device_ratings.comment IS 'Optional comment for the rating';

-- Verification
DO $$
DECLARE
    table_exists BOOLEAN;
    score_exists BOOLEAN;
BEGIN
    -- Check if device_ratings table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_ratings'
    ) INTO table_exists;
    
    -- Check if score column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'device_ratings'
        AND column_name = 'score'
    ) INTO score_exists;
    
    -- Report results
    IF table_exists THEN
        RAISE NOTICE '✅ device_ratings table exists';
    ELSE
        RAISE NOTICE '❌ device_ratings table missing';
    END IF;
    
    IF score_exists THEN
        RAISE NOTICE '✅ score column exists in device_ratings table';
    ELSE
        RAISE NOTICE '❌ score column missing from device_ratings table';
    END IF;
    
    RAISE NOTICE '✅ Device ratings table should now be properly structured!';
END $$;
