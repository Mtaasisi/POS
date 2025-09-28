-- Create customer_checkins table for tracking customer visits
-- Migration: 20250131000070_create_customer_checkins_table.sql

-- Create customer_checkins table
CREATE TABLE IF NOT EXISTS customer_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_checkins_customer_id ON customer_checkins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_staff_id ON customer_checkins(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_checkins_checkin_time ON customer_checkins(checkin_time);

-- Enable RLS
ALTER TABLE customer_checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view customer checkins" ON customer_checkins
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert customer checkins" ON customer_checkins
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update customer checkins" ON customer_checkins
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete customer checkins" ON customer_checkins
    FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_checkins_updated_at
    BEFORE UPDATE ON customer_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_checkins_updated_at();
