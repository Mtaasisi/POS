-- Fix user_daily_goals table permissions and constraints
-- Migration: 20250131000017_fix_user_daily_goals_permissions.sql

-- Check if user_daily_goals table exists, if not create it
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('devices_processed', 'repairs_completed', 'customer_interactions')),
    target_value INTEGER NOT NULL DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, goal_type, DATE(created_at))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_goal_type ON user_daily_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_is_active ON user_daily_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_created_at ON user_daily_goals(created_at);

-- Enable Row Level Security
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON user_daily_goals
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON user_daily_goals TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default goals for existing users if they don't exist
INSERT INTO user_daily_goals (user_id, goal_type, target_value, current_value, is_active) 
SELECT 
    id,
    'devices_processed',
    5,
    0,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT (user_id, goal_type, DATE(created_at)) DO NOTHING;

INSERT INTO user_daily_goals (user_id, goal_type, target_value, current_value, is_active) 
SELECT 
    id,
    'repairs_completed',
    3,
    0,
    true
FROM auth_users 
WHERE role = 'technician'
ON CONFLICT (user_id, goal_type, DATE(created_at)) DO NOTHING;

-- Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_daily_goals' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ User daily goals table created/fixed successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create/fix user daily goals table';
  END IF;
END $$;
