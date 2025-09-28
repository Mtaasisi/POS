-- Consolidated fix for user_daily_goals table
-- Migration: 20250131000022_consolidated_fix_user_daily_goals.sql

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own daily goals" ON user_daily_goals;
DROP POLICY IF EXISTS "Users can insert their own daily goals" ON user_daily_goals;
DROP POLICY IF EXISTS "Users can update their own daily goals" ON user_daily_goals;
DROP POLICY IF EXISTS "Users can delete their own daily goals" ON user_daily_goals;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_daily_goals;

-- Drop the table completely to recreate it properly
DROP TABLE IF EXISTS user_daily_goals CASCADE;

-- Recreate the table with proper schema
CREATE TABLE user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('new_customers', 'devices_processed', 'checkins', 'repairs_completed')),
    goal_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX idx_user_daily_goals_goal_type ON user_daily_goals(goal_type);
CREATE INDEX idx_user_daily_goals_is_active ON user_daily_goals(is_active);
CREATE INDEX idx_user_daily_goals_user_goal_type ON user_daily_goals(user_id, goal_type);

-- Enable Row Level Security
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users (this allows the queries to work)
CREATE POLICY "Enable all access for authenticated users" ON user_daily_goals
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON user_daily_goals TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default goals for existing users
INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'new_customers',
    5,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'checkins',
    10,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'devices_processed',
    8,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 
    id,
    'repairs_completed',
    3,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT DO NOTHING;

-- Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_daily_goals' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ User daily goals table consolidated and fixed successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create/fix user daily goals table';
  END IF;
END $$;
