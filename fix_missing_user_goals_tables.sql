-- Fix Missing User Goals Tables
-- This script creates the missing user_daily_goals table and related tables

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_value IS NULL OR target_value = 0 THEN 0
            ELSE LEAST((current_value / target_value) * 100, 100)
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_daily_goals table
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    daily_date DATE NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, daily_date, goal_type)
);

-- Create staff_points table
CREATE TABLE IF NOT EXISTS staff_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    points INTEGER NOT NULL DEFAULT 0,
    reason VARCHAR(255),
    activity_type VARCHAR(50),
    reference_id UUID,
    reference_type VARCHAR(50),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_checkins table
CREATE TABLE IF NOT EXISTS customer_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    checkin_type VARCHAR(50) DEFAULT 'visit' CHECK (checkin_type IN ('visit', 'call', 'message', 'appointment')),
    notes TEXT,
    staff_id UUID,
    checkin_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_date ON user_daily_goals(user_id, daily_date);
CREATE INDEX IF NOT EXISTS idx_staff_points_user ON staff_points(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_customer ON customer_checkins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_date ON customer_checkins(checkin_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Allow all operations on user_goals" ON user_goals FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_daily_goals" ON user_daily_goals FOR ALL USING (true);
CREATE POLICY "Allow all operations on staff_points" ON staff_points FOR ALL USING (true);
CREATE POLICY "Allow all operations on customer_checkins" ON customer_checkins FOR ALL USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_goals_updated_at BEFORE UPDATE ON user_daily_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO user_daily_goals (user_id, daily_date, goal_type, target_value, current_value, unit, status)
VALUES 
    ('a7c9adb7-f525-4850-bd42-79a769f12953', CURRENT_DATE, 'new_customers', 5, 0, 'customers', 'active'),
    ('a7c9adb7-f525-4850-bd42-79a769f12953', CURRENT_DATE, 'checkins', 10, 0, 'checkins', 'active')
ON CONFLICT (user_id, daily_date, goal_type) DO NOTHING;

-- Verify tables were created
SELECT 'user_goals' as table_name, COUNT(*) as row_count FROM user_goals
UNION ALL
SELECT 'user_daily_goals' as table_name, COUNT(*) as row_count FROM user_daily_goals
UNION ALL
SELECT 'staff_points' as table_name, COUNT(*) as row_count FROM staff_points
UNION ALL
SELECT 'customer_checkins' as table_name, COUNT(*) as row_count FROM customer_checkins; 