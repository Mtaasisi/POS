-- WhatsApp Connection Manager Database Schema
-- This migration creates a comprehensive system for managing WhatsApp connections
-- Using Green API with all supported endpoints and configurations

-- Drop existing tables if they exist for clean rebuild
DROP TABLE IF EXISTS whatsapp_connection_settings CASCADE;
DROP TABLE IF EXISTS whatsapp_instances_comprehensive CASCADE;
DROP TABLE IF EXISTS whatsapp_qr_codes CASCADE;

-- Main WhatsApp Connection Instances Table
CREATE TABLE whatsapp_instances_comprehensive (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Instance Information
    instance_id VARCHAR(50) NOT NULL UNIQUE,
    api_token VARCHAR(255) NOT NULL,
    instance_name VARCHAR(100),
    description TEXT,
    
    -- Green API Configuration
    green_api_host VARCHAR(255) DEFAULT 'https://api.green-api.com',
    green_api_url VARCHAR(255),
    
    -- Instance Status
    state_instance VARCHAR(50) DEFAULT 'notAuthorized',
    status VARCHAR(50) DEFAULT 'disconnected',
    phone_number VARCHAR(20),
    wid VARCHAR(50),
    country_instance VARCHAR(10),
    type_account VARCHAR(50),
    
    -- Connection Details
    is_active BOOLEAN DEFAULT true,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    -- Profile Information
    profile_name VARCHAR(100),
    profile_picture_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Connection Settings Table (for all Green API settings)
CREATE TABLE whatsapp_connection_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id VARCHAR(50) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Webhook Configuration
    webhook_url TEXT,
    webhook_url_token VARCHAR(255),
    
    -- Message Settings
    delay_send_messages_milliseconds INTEGER DEFAULT 1000,
    mark_incoming_messages_readed VARCHAR(3) DEFAULT 'no',
    mark_incoming_messages_readed_on_reply VARCHAR(3) DEFAULT 'no',
    
    -- Webhook Notifications
    outgoing_webhook VARCHAR(3) DEFAULT 'yes',
    outgoing_message_webhook VARCHAR(3) DEFAULT 'yes',
    outgoing_api_message_webhook VARCHAR(3) DEFAULT 'yes',
    incoming_webhook VARCHAR(3) DEFAULT 'yes',
    device_webhook VARCHAR(3) DEFAULT 'no',
    state_webhook VARCHAR(3) DEFAULT 'yes',
    poll_message_webhook VARCHAR(3) DEFAULT 'no',
    incoming_block_webhook VARCHAR(3) DEFAULT 'no',
    incoming_call_webhook VARCHAR(3) DEFAULT 'no',
    edited_message_webhook VARCHAR(3) DEFAULT 'no',
    deleted_message_webhook VARCHAR(3) DEFAULT 'no',
    
    -- Status Settings
    keep_online_status VARCHAR(3) DEFAULT 'no',
    
    -- Deprecated fields (for compatibility)
    shared_session VARCHAR(3) DEFAULT 'no',
    status_instance_webhook VARCHAR(3) DEFAULT 'no',
    enable_messages_history VARCHAR(3) DEFAULT 'no',
    
    -- Auto-sync settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(instance_id, user_id)
);

-- QR Codes Management Table
CREATE TABLE whatsapp_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id VARCHAR(50) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- QR Code Data
    qr_code_base64 TEXT,
    qr_code_url TEXT,
    
    -- QR Code Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    scan_attempts INTEGER DEFAULT 0,
    max_scan_attempts INTEGER DEFAULT 3,
    
    -- Authorization
    authorization_code VARCHAR(255),
    is_scanned BOOLEAN DEFAULT false,
    scanned_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);
CREATE INDEX idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);
CREATE INDEX idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);

CREATE INDEX idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);
CREATE INDEX idx_whatsapp_settings_user_id ON whatsapp_connection_settings(user_id);

CREATE INDEX idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);
CREATE INDEX idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);
CREATE INDEX idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);

-- Add constraints
ALTER TABLE whatsapp_connection_settings 
ADD CONSTRAINT check_webhook_yes_no 
CHECK (
    outgoing_webhook IN ('yes', 'no') AND
    outgoing_message_webhook IN ('yes', 'no') AND
    outgoing_api_message_webhook IN ('yes', 'no') AND
    incoming_webhook IN ('yes', 'no') AND
    device_webhook IN ('yes', 'no') AND
    state_webhook IN ('yes', 'no') AND
    poll_message_webhook IN ('yes', 'no') AND
    incoming_block_webhook IN ('yes', 'no') AND
    incoming_call_webhook IN ('yes', 'no') AND
    edited_message_webhook IN ('yes', 'no') AND
    deleted_message_webhook IN ('yes', 'no') AND
    keep_online_status IN ('yes', 'no') AND
    mark_incoming_messages_readed IN ('yes', 'no') AND
    mark_incoming_messages_readed_on_reply IN ('yes', 'no') AND
    shared_session IN ('yes', 'no') AND
    status_instance_webhook IN ('yes', 'no') AND
    enable_messages_history IN ('yes', 'no')
);

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_instances_updated_at 
    BEFORE UPDATE ON whatsapp_instances_comprehensive 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_settings_updated_at 
    BEFORE UPDATE ON whatsapp_connection_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_qr_updated_at 
    BEFORE UPDATE ON whatsapp_qr_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_instances_comprehensive
CREATE POLICY "Users can view their own instances" ON whatsapp_instances_comprehensive
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instances" ON whatsapp_instances_comprehensive
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances" ON whatsapp_instances_comprehensive
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances" ON whatsapp_instances_comprehensive
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for whatsapp_connection_settings
CREATE POLICY "Users can view their own settings" ON whatsapp_connection_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON whatsapp_connection_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON whatsapp_connection_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON whatsapp_connection_settings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for whatsapp_qr_codes
CREATE POLICY "Users can view their own QR codes" ON whatsapp_qr_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own QR codes" ON whatsapp_qr_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" ON whatsapp_qr_codes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR codes" ON whatsapp_qr_codes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE whatsapp_instances_comprehensive IS 'Main table for storing WhatsApp instance information with comprehensive Green API support';
COMMENT ON TABLE whatsapp_connection_settings IS 'All Green API settings and webhook configurations for WhatsApp instances';
COMMENT ON TABLE whatsapp_qr_codes IS 'QR code management for WhatsApp instance authentication';

-- Insert default webhook settings template
INSERT INTO whatsapp_connection_settings (
    instance_id, user_id, 
    webhook_url, delay_send_messages_milliseconds,
    outgoing_webhook, incoming_webhook, state_webhook
) 
SELECT 
    'template_default', auth.uid(), 
    '', 1000,
    'yes', 'yes', 'yes'
WHERE FALSE; -- This is just a template, won't actually insert