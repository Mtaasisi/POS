-- Create WhatsApp Hub Settings Table
-- This migration creates a table to store user-specific WhatsApp Hub settings

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS whatsapp_hub_settings CASCADE;

-- Create WhatsApp Hub Settings Table
CREATE TABLE whatsapp_hub_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_refresh_interval INTEGER DEFAULT 30 CHECK (auto_refresh_interval >= 10 AND auto_refresh_interval <= 3600),
    default_message_type VARCHAR(20) DEFAULT 'text' CHECK (default_message_type IN ('text', 'image', 'document', 'location', 'contact')),
    enable_notifications BOOLEAN DEFAULT true,
    enable_sound_alerts BOOLEAN DEFAULT false,
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 1 AND max_retries <= 10),
    message_delay INTEGER DEFAULT 1000 CHECK (message_delay >= 500 AND message_delay <= 10000),
    enable_webhooks BOOLEAN DEFAULT true,
    enable_analytics BOOLEAN DEFAULT true,
    enable_bulk_messaging BOOLEAN DEFAULT true,
    enable_template_management BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_hub_settings_user_id ON whatsapp_hub_settings(user_id);
CREATE INDEX idx_whatsapp_hub_settings_updated_at ON whatsapp_hub_settings(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_hub_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON whatsapp_hub_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON whatsapp_hub_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON whatsapp_hub_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON whatsapp_hub_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_hub_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_whatsapp_hub_settings_updated_at
    BEFORE UPDATE ON whatsapp_hub_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_hub_settings_updated_at();

-- Insert default settings for existing users (optional)
-- This can be run manually if needed
-- INSERT INTO whatsapp_hub_settings (user_id) 
-- SELECT id FROM auth.users 
-- WHERE id NOT IN (SELECT user_id FROM whatsapp_hub_settings);

-- Add comments for documentation
COMMENT ON TABLE whatsapp_hub_settings IS 'Stores user-specific settings for WhatsApp Hub functionality';
COMMENT ON COLUMN whatsapp_hub_settings.auto_refresh_interval IS 'Auto refresh interval in seconds (10-3600)';
COMMENT ON COLUMN whatsapp_hub_settings.default_message_type IS 'Default message type for new messages';
COMMENT ON COLUMN whatsapp_hub_settings.enable_notifications IS 'Whether to enable notifications';
COMMENT ON COLUMN whatsapp_hub_settings.enable_sound_alerts IS 'Whether to enable sound alerts';
COMMENT ON COLUMN whatsapp_hub_settings.max_retries IS 'Maximum retry attempts for failed messages (1-10)';
COMMENT ON COLUMN whatsapp_hub_settings.message_delay IS 'Delay between messages in milliseconds (500-10000)';
COMMENT ON COLUMN whatsapp_hub_settings.enable_webhooks IS 'Whether to enable webhook functionality';
COMMENT ON COLUMN whatsapp_hub_settings.enable_analytics IS 'Whether to enable analytics tracking';
COMMENT ON COLUMN whatsapp_hub_settings.enable_bulk_messaging IS 'Whether to enable bulk messaging features';
COMMENT ON COLUMN whatsapp_hub_settings.enable_template_management IS 'Whether to enable template management features';
