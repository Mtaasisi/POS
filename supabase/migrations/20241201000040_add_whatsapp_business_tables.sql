-- Add WhatsApp Business API settings
INSERT INTO settings (key, value, description) VALUES
('whatsapp_business_access_token', '', 'WhatsApp Business API Access Token'),
('whatsapp_business_phone_number_id', '', 'WhatsApp Business Phone Number ID'),
('whatsapp_business_account_id', '', 'WhatsApp Business Account ID'),
('whatsapp_business_app_id', '', 'Meta App ID'),
('whatsapp_business_app_secret', '', 'Meta App Secret'),
('whatsapp_business_webhook_verify_token', '', 'Webhook Verification Token'),
('whatsapp_business_api_version', 'v18.0', 'Meta Graph API Version'),
('whatsapp_business_enabled', 'false', 'Enable WhatsApp Business API'),
('whatsapp_business_webhook_url', '', 'Webhook URL for WhatsApp Business API')
ON CONFLICT (key) DO NOTHING;

-- Add WhatsApp Business templates table
CREATE TABLE IF NOT EXISTS whatsapp_business_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en_US',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    category VARCHAR(50),
    components JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add WhatsApp Business media table
CREATE TABLE IF NOT EXISTS whatsapp_business_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id VARCHAR(255) NOT NULL UNIQUE,
    url TEXT,
    mime_type VARCHAR(100),
    sha256 VARCHAR(64),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Add WhatsApp Business message templates table
CREATE TABLE IF NOT EXISTS whatsapp_business_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en_US',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    category VARCHAR(50),
    components JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_business_templates_name ON whatsapp_business_templates(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_business_templates_status ON whatsapp_business_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_business_media_media_id ON whatsapp_business_media(media_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_business_media_expires_at ON whatsapp_business_media(expires_at);

-- Add RLS policies for WhatsApp Business tables
ALTER TABLE whatsapp_business_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_business_templates
CREATE POLICY "Enable read access for authenticated users" ON whatsapp_business_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_business_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON whatsapp_business_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON whatsapp_business_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS policies for whatsapp_business_media
CREATE POLICY "Enable read access for authenticated users" ON whatsapp_business_media
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_business_media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON whatsapp_business_media
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON whatsapp_business_media
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS policies for whatsapp_business_message_templates
CREATE POLICY "Enable read access for authenticated users" ON whatsapp_business_message_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_business_message_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON whatsapp_business_message_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON whatsapp_business_message_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_whatsapp_business_templates_updated_at 
    BEFORE UPDATE ON whatsapp_business_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_business_message_templates_updated_at 
    BEFORE UPDATE ON whatsapp_business_message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
