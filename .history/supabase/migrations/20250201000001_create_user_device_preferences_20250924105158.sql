-- Migration: 20250201000001_create_user_device_preferences.sql
-- Create table for storing user's custom device preferences for spare parts

-- =====================================================
-- USER DEVICE PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_device_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_category VARCHAR(50), -- smartphone, tablet, laptop, etc.
    device_brand VARCHAR(100), -- Apple, Samsung, etc.
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_device_preferences_user_id ON user_device_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_preferences_device_name ON user_device_preferences(device_name);
CREATE INDEX IF NOT EXISTS idx_user_device_preferences_last_used ON user_device_preferences(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_user_device_preferences_usage_count ON user_device_preferences(usage_count DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_device_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own device preferences" ON user_device_preferences;
    DROP POLICY IF EXISTS "Users can insert their own device preferences" ON user_device_preferences;
    DROP POLICY IF EXISTS "Users can update their own device preferences" ON user_device_preferences;
    DROP POLICY IF EXISTS "Users can delete their own device preferences" ON user_device_preferences;
    
    -- Create new policies
    CREATE POLICY "Users can view their own device preferences" ON user_device_preferences
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own device preferences" ON user_device_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own device preferences" ON user_device_preferences
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own device preferences" ON user_device_preferences
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_device_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_user_device_preferences_updated_at
    BEFORE UPDATE ON user_device_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_device_preferences_updated_at();

-- Create function to increment usage count when device is used
CREATE OR REPLACE FUNCTION increment_device_usage(device_name_param VARCHAR(255))
RETURNS VOID AS $$
BEGIN
    UPDATE user_device_preferences 
    SET 
        usage_count = usage_count + 1,
        last_used = NOW()
    WHERE 
        user_id = auth.uid() 
        AND device_name = device_name_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_device_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION increment_device_usage(VARCHAR(255)) TO authenticated;
