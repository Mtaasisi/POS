import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const migrationSQL = `
-- Create user_daily_goals table
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('new_customers', 'devices_processed', 'checkins', 'repairs_completed')),
    goal_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_goal_type ON user_daily_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_is_active ON user_daily_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_goal_type ON user_daily_goals(user_id, goal_type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own daily goals" ON user_daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals" ON user_daily_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals" ON user_daily_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily goals" ON user_daily_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

async function applyMigration() {
  try {
    console.log('🔧 Applying user_daily_goals table migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the table by checking if it exists
    const { data: testData, error: testError } = await supabase
      .from('user_daily_goals')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table test failed:', testError);
    } else {
      console.log('✅ Table exists and is accessible!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyMigration();
