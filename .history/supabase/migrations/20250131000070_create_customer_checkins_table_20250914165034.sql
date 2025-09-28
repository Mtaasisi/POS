-- Create customer_checkins table for tracking customer visits
-- Migration: 20250131000070_create_customer_checkins_table.sql

-- Create customer_checkins table (matching actual existing structure)
CREATE TABLE IF NOT EXISTS customer_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    checkin_type TEXT DEFAULT 'visit',
    notes TEXT,
    staff_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    checkin_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_checkins_customer_id ON customer_checkins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_staff_id ON customer_checkins(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_checkin_at ON customer_checkins(checkin_at);

-- Enable RLS
ALTER TABLE customer_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view customer checkins" ON customer_checkins;
CREATE POLICY "Users can view customer checkins" ON customer_checkins
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert customer checkins" ON customer_checkins;
CREATE POLICY "Users can insert customer checkins" ON customer_checkins
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update customer checkins" ON customer_checkins;
CREATE POLICY "Users can update customer checkins" ON customer_checkins
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete customer checkins" ON customer_checkins;
CREATE POLICY "Users can delete customer checkins" ON customer_checkins
    FOR DELETE USING (true);

-- Note: No updated_at trigger needed as the actual table doesn't have an updated_at column
