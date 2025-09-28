-- Create staff_points table for tracking technician/staff points
-- Migration: 20250131000059_create_staff_points_table.sql

-- Create staff_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT NOT NULL,
    created_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_staff_points_user_id ON staff_points(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_points_earned_date ON staff_points(earned_date);

-- Add RLS policies
ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own points
CREATE POLICY "Users can view own staff points" ON staff_points
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);

-- Policy: Users can insert their own points (for system operations)
CREATE POLICY "Users can insert staff points" ON staff_points
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Admins can view all staff points
CREATE POLICY "Admins can view all staff points" ON staff_points
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Policy: Admins can insert staff points
CREATE POLICY "Admins can insert staff points" ON staff_points
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );
