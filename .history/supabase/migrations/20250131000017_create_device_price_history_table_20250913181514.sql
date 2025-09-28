-- Create device_price_history table for tracking price changes
-- Migration: 20250131000017_create_device_price_history_table.sql

-- Create device_price_history table
CREATE TABLE IF NOT EXISTS device_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    new_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'Price adjustment',
    updated_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_price_history_device_id ON device_price_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_at ON device_price_history(updated_at);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_by ON device_price_history(updated_by);

-- Enable Row Level Security
ALTER TABLE device_price_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON device_price_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON device_price_history TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE device_price_history IS 'Tracks all changes to device repair prices for audit purposes';
