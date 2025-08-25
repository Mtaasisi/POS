-- Green API Integration Migration
-- This migration extends WhatsApp functionality with Green API integration

-- Extend whatsapp_instances table with Green API fields
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS green_api_instance_id TEXT,
ADD COLUMN IF NOT EXISTS green_api_token TEXT,
ADD COLUMN IF NOT EXISTS green_api_host TEXT DEFAULT 'https://api.green-api.com',
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS is_green_api BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_connection_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS connection_error TEXT;

-- Create Green API message queue table
CREATE TABLE IF NOT EXISTS green_api_message_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES whatsapp_instances(instance_id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'rate_limited')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    green_api_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Green API webhook events table
CREATE TABLE IF NOT EXISTS green_api_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES whatsapp_instances(instance_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Green API settings table
CREATE TABLE IF NOT EXISTS green_api_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Green API message templates table
CREATE TABLE IF NOT EXISTS green_api_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    template_text TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Green API bulk messaging campaigns table
CREATE TABLE IF NOT EXISTS green_api_bulk_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instance_id TEXT NOT NULL REFERENCES whatsapp_instances(instance_id) ON DELETE CASCADE,
    template_id UUID REFERENCES green_api_message_templates(id) ON DELETE SET NULL,
    target_audience JSONB DEFAULT '[]',
    message_content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Green API bulk campaign results table
CREATE TABLE IF NOT EXISTS green_api_bulk_campaign_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES green_api_bulk_campaigns(id) ON DELETE CASCADE,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'rate_limited')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_green_api_message_queue_instance ON green_api_message_queue(instance_id);
CREATE INDEX IF NOT EXISTS idx_green_api_message_queue_status ON green_api_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_green_api_message_queue_scheduled ON green_api_message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_green_api_webhook_events_instance ON green_api_webhook_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_green_api_webhook_events_type ON green_api_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_green_api_webhook_events_processed ON green_api_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_green_api_bulk_campaigns_instance ON green_api_bulk_campaigns(instance_id);
CREATE INDEX IF NOT EXISTS idx_green_api_bulk_campaigns_status ON green_api_bulk_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_green_api_bulk_campaign_results_campaign ON green_api_bulk_campaign_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_green_api_bulk_campaign_results_status ON green_api_bulk_campaign_results(status);

-- Enable Row Level Security
ALTER TABLE green_api_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_api_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_api_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_api_bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_api_bulk_campaign_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for green_api_message_queue
CREATE POLICY "Users can view their message queue" ON green_api_message_queue
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert to their message queue" ON green_api_message_queue
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their message queue" ON green_api_message_queue
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for green_api_webhook_events
CREATE POLICY "Users can view their webhook events" ON green_api_webhook_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert webhook events" ON green_api_webhook_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their webhook events" ON green_api_webhook_events
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for green_api_settings
CREATE POLICY "Users can view settings" ON green_api_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert settings" ON green_api_settings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update settings" ON green_api_settings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for green_api_message_templates
CREATE POLICY "Users can view message templates" ON green_api_message_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert message templates" ON green_api_message_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update message templates" ON green_api_message_templates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for green_api_bulk_campaigns
CREATE POLICY "Users can view their bulk campaigns" ON green_api_bulk_campaigns
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert bulk campaigns" ON green_api_bulk_campaigns
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their bulk campaigns" ON green_api_bulk_campaigns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for green_api_bulk_campaign_results
CREATE POLICY "Users can view their campaign results" ON green_api_bulk_campaign_results
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert campaign results" ON green_api_bulk_campaign_results
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their campaign results" ON green_api_bulk_campaign_results
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_green_api_message_queue_updated_at 
    BEFORE UPDATE ON green_api_message_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_green_api_settings_updated_at 
    BEFORE UPDATE ON green_api_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_green_api_message_templates_updated_at 
    BEFORE UPDATE ON green_api_message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_green_api_bulk_campaigns_updated_at 
    BEFORE UPDATE ON green_api_bulk_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default Green API settings
INSERT INTO green_api_settings (setting_key, setting_value, description, is_encrypted) VALUES
('green_api_default_host', 'https://api.green-api.com', 'Default Green API host URL', false),
('green_api_rate_limit_per_minute', '30', 'Rate limit for messages per minute', false),
('green_api_retry_delay_seconds', '60', 'Delay between retries in seconds', false),
('green_api_max_retries', '3', 'Maximum number of retries for failed messages', false),
('green_api_webhook_timeout', '30', 'Webhook timeout in seconds', false),
('green_api_bulk_delay_ms', '2000', 'Delay between bulk messages in milliseconds', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default message templates
INSERT INTO green_api_message_templates (name, category, template_text, variables, language) VALUES
('Welcome Message', 'customer', 'Welcome to LATS! Hi {{customerName}}, thank you for choosing our services. We are here to help you with all your device repair needs.', '[{"name": "customerName", "type": "string", "required": true}]', 'en'),
('Order Confirmation', 'order', 'Order Confirmed! Hi {{customerName}}, your order #{{orderNumber}} has been confirmed and is being processed. Expected delivery: {{deliveryDate}}', '[{"name": "customerName", "type": "string", "required": true}, {"name": "orderNumber", "type": "string", "required": true}, {"name": "deliveryDate", "type": "string", "required": true}]', 'en'),
('Repair Update', 'repair', 'Repair Update: Hi {{customerName}}, your {{deviceModel}} repair is {{status}}. {{additionalInfo}}', '[{"name": "customerName", "type": "string", "required": true}, {"name": "deviceModel", "type": "string", "required": true}, {"name": "status", "type": "string", "required": true}, {"name": "additionalInfo", "type": "string", "required": false}]', 'en'),
('Birthday Wish', 'birthday', 'Happy Birthday {{customerName}}! 🎉 Wishing you a fantastic day filled with joy and happiness. Thank you for being our valued customer!', '[{"name": "customerName", "type": "string", "required": true}]', 'en'),
('Promotional Offer', 'promotion', 'Special Offer! Hi {{customerName}}, {{offerDescription}}. Valid until {{expiryDate}}. Call us at {{phoneNumber}} to claim!', '[{"name": "customerName", "type": "string", "required": true}, {"name": "offerDescription", "type": "string", "required": true}, {"name": "expiryDate", "type": "string", "required": true}, {"name": "phoneNumber", "type": "string", "required": true}]', 'en')
ON CONFLICT (name) DO NOTHING;
