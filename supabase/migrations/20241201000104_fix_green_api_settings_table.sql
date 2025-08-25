-- Fix green_api_settings table structure
-- This migration addresses the 409 conflict errors and improves the table structure

-- Drop existing table if it exists (be careful in production)
DROP TABLE IF EXISTS green_api_settings CASCADE;

-- Create the green_api_settings table with proper structure
CREATE TABLE green_api_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_green_api_settings_key ON green_api_settings(setting_key);
CREATE INDEX idx_green_api_settings_created_at ON green_api_settings(created_at);

-- Add RLS policies
ALTER TABLE green_api_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all settings
CREATE POLICY "Users can read green api settings" ON green_api_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert settings
CREATE POLICY "Users can insert green api settings" ON green_api_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update settings
CREATE POLICY "Users can update green api settings" ON green_api_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete settings
CREATE POLICY "Users can delete green api settings" ON green_api_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_green_api_settings_updated_at 
    BEFORE UPDATE ON green_api_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default settings for testing (optional)
INSERT INTO green_api_settings (setting_key, setting_value, description) VALUES
('default_webhook_url', '', 'Default webhook URL for Green API instances'),
('default_delay_ms', '5000', 'Default message delay in milliseconds'),
('default_mark_read', 'no', 'Default setting for marking messages as read')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON green_api_settings TO authenticated;
GRANT USAGE ON SEQUENCE green_api_settings_id_seq TO authenticated;
