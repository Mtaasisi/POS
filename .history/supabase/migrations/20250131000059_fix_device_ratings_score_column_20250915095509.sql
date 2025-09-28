-- Fix device_ratings table by adding the missing score column
-- Migration: 20250131000059_fix_device_ratings_score_column.sql

-- Add the missing score column to device_ratings table
ALTER TABLE device_ratings 
ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 5 CHECK (score >= 1 AND score <= 5);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_device_ratings_score ON device_ratings(score);

-- Add comment for documentation
COMMENT ON COLUMN device_ratings.score IS 'Rating score from 1 to 5 stars';

-- Verification
DO $$
DECLARE
    score_exists BOOLEAN;
BEGIN
    -- Check if score column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'device_ratings'
        AND column_name = 'score'
    ) INTO score_exists;
    
    -- Report results
    IF score_exists THEN
        RAISE NOTICE '✅ score column exists in device_ratings table';
    ELSE
        RAISE NOTICE '❌ score column missing from device_ratings table';
    END IF;
    
    RAISE NOTICE '✅ Device ratings score column should now be available!';
END $$;
