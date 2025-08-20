-- Add Chrome Extension WhatsApp integration tables

-- WhatsApp messages table for Chrome extension
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    chat_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_from_me BOOLEAN NOT NULL DEFAULT false,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    processed BOOLEAN NOT NULL DEFAULT false,
    auto_replied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table for automated ticket creation
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_to UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table for appointment requests
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    source VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chrome extension settings table
CREATE TABLE IF NOT EXISTS chrome_extension_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_ticket_creation BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-reply templates table
CREATE TABLE IF NOT EXISTS auto_reply_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_keywords TEXT[] NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_phone ON whatsapp_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_processed ON whatsapp_messages(processed);

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_phone ON support_tickets(customer_phone);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON support_tickets(source);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_auto_reply_templates_active ON auto_reply_templates(is_active);

-- Add RLS policies (simplified)
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chrome_extension_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_templates ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at 
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chrome_extension_settings_updated_at 
    BEFORE UPDATE ON chrome_extension_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_reply_templates_updated_at 
    BEFORE UPDATE ON auto_reply_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default Chrome extension settings
INSERT INTO chrome_extension_settings (api_key, webhook_url, is_enabled, auto_reply_enabled, auto_ticket_creation)
VALUES (
    '1755675069644-f5ab0e92276f1e3332d41ece111c6201',
    '',
    true,
    true,
    true
);

-- Insert default auto-reply templates
INSERT INTO auto_reply_templates (name, trigger_keywords, message, priority) VALUES
('Order Inquiry', ARRAY['order', 'buy', 'price', 'cost'], 'Thank you for your inquiry! Our team will assist you with your order. You''ll receive a response shortly.', 1);

INSERT INTO auto_reply_templates (name, trigger_keywords, message, priority) VALUES
('Support Request', ARRAY['help', 'support', 'problem', 'issue'], 'We''re here to help! Your support request has been logged and our team will contact you soon.', 2);

INSERT INTO auto_reply_templates (name, trigger_keywords, message, priority) VALUES
('Appointment Request', ARRAY['appointment', 'book', 'schedule', 'meeting'], 'Thank you for requesting an appointment! We''ll contact you to confirm the details.', 3);

INSERT INTO auto_reply_templates (name, trigger_keywords, message, priority) VALUES
('Payment Inquiry', ARRAY['payment', 'pay', 'mpesa', 'cash'], 'We accept M-Pesa, Cash, and Card payments. For M-Pesa, please use our Paybill number: 123456', 4);
