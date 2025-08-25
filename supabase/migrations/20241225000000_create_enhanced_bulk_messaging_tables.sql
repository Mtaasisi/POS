-- Enhanced WhatsApp Bulk Messaging Tables Migration
-- This migration creates all necessary tables for the enhanced bulk messaging system

-- 1. WhatsApp Campaigns Table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    message_template TEXT NOT NULL,
    language VARCHAR(10) CHECK (language IN ('en', 'sw', 'both')) DEFAULT 'both',
    variant VARCHAR(10) CHECK (variant IN ('A', 'B', 'single')) DEFAULT 'single',
    personalization_data JSONB DEFAULT '{}',
    target_audience JSONB DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    status VARCHAR(20) CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused')) DEFAULT 'draft',
    ai_analysis JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WhatsApp Bulk Message Results Table
CREATE TABLE IF NOT EXISTS whatsapp_bulk_message_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'rate_limited', 'opted_out')) DEFAULT 'pending',
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WhatsApp Escalations Table
CREATE TABLE IF NOT EXISTS whatsapp_escalations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'assigned', 'resolved')) DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WhatsApp Contact Preferences Table
CREATE TABLE IF NOT EXISTS whatsapp_contact_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    language_preference VARCHAR(10) CHECK (language_preference IN ('en', 'sw')) DEFAULT 'en',
    opt_in_status VARCHAR(20) CHECK (opt_in_status IN ('opted_in', 'opted_out', 'pending')) DEFAULT 'opted_in',
    last_sent_date TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WhatsApp Message Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('greeting', 'promotional', 'service', 'support', 'custom')) DEFAULT 'custom',
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language VARCHAR(10) CHECK (language IN ('en', 'sw', 'both')) DEFAULT 'both',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. WhatsApp Analytics Events Table
CREATE TABLE IF NOT EXISTS whatsapp_analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_created_at ON whatsapp_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_language ON whatsapp_campaigns(language);

CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_results_campaign_id ON whatsapp_bulk_message_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_results_status ON whatsapp_bulk_message_results(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_results_phone ON whatsapp_bulk_message_results(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_results_sent_at ON whatsapp_bulk_message_results(sent_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_escalations_status ON whatsapp_escalations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_escalations_chat_id ON whatsapp_escalations(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_escalations_created_at ON whatsapp_escalations(created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_prefs_customer_id ON whatsapp_contact_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_prefs_phone ON whatsapp_contact_preferences(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_prefs_opt_in ON whatsapp_contact_preferences(opt_in_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON whatsapp_message_templates(language);

CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_event_type ON whatsapp_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_timestamp ON whatsapp_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_campaign_id ON whatsapp_analytics_events(campaign_id);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_message_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON whatsapp_campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_campaigns FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_bulk_message_results FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_bulk_message_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_bulk_message_results FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_escalations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_escalations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_escalations FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_contact_preferences FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_contact_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_contact_preferences FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_message_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_analytics_events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_analytics_events FOR UPDATE USING (true);

-- Insert default message templates
INSERT INTO whatsapp_message_templates (name, category, template, variables, language, is_active) VALUES
('Welcome Message', 'greeting', '🎉 Welcome to LATS CHANCE!

Hi {{name}},

Thank you for choosing our services. We''re excited to have you on board!

Your customer ID: {{customerId}}
Registration date: {{date}}

If you have any questions, feel free to reach out to us.

Best regards,
The LATS Team 🚀

Reply STOP to unsubscribe', '["name", "customerId", "date"]', 'both', true),

('Order Update', 'service', '📦 Order Update

Hi {{name}},

Your order #{{orderId}} has been {{status}}!

Order Details:
📋 Items: {{items}}
💰 Total: ${{total}}
📍 {{location}}

Thank you for choosing LATS! 🚀

Reply STOP to unsubscribe', '["name", "orderId", "status", "items", "total", "location"]', 'both', true),

('Appointment Reminder', 'service', '⏰ Appointment Reminder

Hi {{name}},

This is a friendly reminder about your upcoming appointment:

📅 Date: {{date}}
⏰ Time: {{time}}
📍 Location: {{location}}
🔧 Service: {{service}}

Please arrive 10 minutes early.

See you soon! 🚀

Reply STOP to unsubscribe', '["name", "date", "time", "location", "service"]', 'both', true),

('Promotional Offer', 'promotional', '🎊 Special Promotion!

Hi {{name}},

{{promotionText}}

🎯 {{offerDetails}}
⏰ Valid until: {{validUntil}}

Don''t miss out!

Best regards,
LATS Team 🚀

Reply STOP to unsubscribe', '["name", "promotionText", "offerDetails", "validUntil"]', 'both', true),

('Customer Support', 'support', '🛠️ Customer Support

Hi {{name}},

Thank you for contacting LATS CHANCE support.

We''re here to help you with any questions or issues you may have.

Our team will get back to you shortly.

Best regards,
LATS Support Team 🚀

Reply STOP to unsubscribe', '["name"]', 'both', true);

-- Add whatsapp_opt_out column to customers table if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Create index on whatsapp_opt_out
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);

-- Add comment for documentation
COMMENT ON TABLE whatsapp_campaigns IS 'Stores WhatsApp bulk messaging campaigns with AI analysis';
COMMENT ON TABLE whatsapp_bulk_message_results IS 'Stores results of bulk message sends';
COMMENT ON TABLE whatsapp_escalations IS 'Stores messages that need human intervention';
COMMENT ON TABLE whatsapp_contact_preferences IS 'Stores contact preferences and opt-in status';
COMMENT ON TABLE whatsapp_message_templates IS 'Stores reusable message templates';
COMMENT ON TABLE whatsapp_analytics_events IS 'Stores analytics events for tracking';
COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether the customer has opted out of WhatsApp messages';
