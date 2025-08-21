-- Create Settings Table Migration
-- This migration creates the main settings table that stores key-value pairs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read settings" 
ON settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow admin users to manage settings" 
ON settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
('attendance', '{"enabled": true, "requireLocation": true, "requireWifi": true, "allowMobileData": true, "gpsAccuracy": 50, "checkInRadius": 100, "checkInTime": "08:00", "checkOutTime": "17:00", "gracePeriod": 15, "offices": [{"name": "Arusha Main Office", "lat": -3.359178, "lng": 36.661366, "radius": 100, "address": "Main Office, Arusha, Tanzania", "networks": [{"ssid": "Office_WiFi", "bssid": "00:11:22:33:44:55", "description": "Main office WiFi network"}, {"ssid": "Office_Guest", "description": "Guest WiFi network"}, {"ssid": "4G_Mobile", "description": "Mobile data connection"}]}]}', 'Attendance tracking settings', 'attendance')
ON CONFLICT (key) DO NOTHING;
