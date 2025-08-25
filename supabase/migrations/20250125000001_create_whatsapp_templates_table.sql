-- Create WhatsApp Message Templates Table
-- This migration ensures the WhatsApp templates table exists with proper structure

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS whatsapp_message_templates CASCADE;

-- Create WhatsApp Message Templates Table
CREATE TABLE whatsapp_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('greeting', 'pos', 'customer', 'support', 'marketing', 'appointment', 'reminder', 'promotional', 'emergency', 'general')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'sw', 'both')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX idx_whatsapp_templates_active ON whatsapp_message_templates(is_active);
CREATE INDEX idx_whatsapp_templates_language ON whatsapp_message_templates(language);
CREATE INDEX idx_whatsapp_templates_created_at ON whatsapp_message_templates(created_at);

-- Enable Row Level Security
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON whatsapp_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_message_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON whatsapp_message_templates FOR DELETE USING (true);

-- Insert default templates
INSERT INTO whatsapp_message_templates (name, category, template, variables, language, is_active) VALUES
-- Greeting Templates
('Welcome Message', 'greeting', '🎉 Welcome to LATS CHANCE!

Hi {{customerName}},

Thank you for choosing our services. We''re excited to have you on board!

Your customer ID: {{customerId}}
Registration date: {{date}}

If you have any questions, feel free to reach out to us.

Best regards,
The LATS Team 🚀

Reply STOP to unsubscribe', '["customerName", "customerId", "date"]', 'both', true),

-- POS/Order Templates
('Order Confirmation', 'pos', '📦 Order Confirmation

Hi {{customerName}},

Your order has been confirmed!

Order Details:
📋 Order ID: {{orderId}}
💰 Total: {{orderTotal}}
📦 Items: {{orderItems}}
📅 Expected Delivery: {{deliveryDate}}

Thank you for choosing LATS! 🚀

Reply STOP to unsubscribe', '["customerName", "orderId", "orderTotal", "orderItems", "deliveryDate"]', 'both', true),

('Order Status Update', 'pos', '📦 Order Status Update

Hi {{customerName}},

Your order #{{orderId}} status: {{orderStatus}}

{{statusDetails}}

Expected completion: {{expectedDate}}

Thank you for your patience! 🚀', '["customerName", "orderId", "orderStatus", "statusDetails", "expectedDate"]', 'both', true),

-- Customer Service Templates
('Support Acknowledgment', 'customer', '🔧 Support Request Received

Hi {{customerName}},

Thank you for contacting LATS support. We have received your request and our team is working on it.

📋 Reference: {{supportTicket}}
📅 Expected Response: {{responseTime}}

We''ll get back to you as soon as possible.

Thank you for your patience! 🚀', '["customerName", "supportTicket", "responseTime"]', 'both', true),

('Support Resolution', 'customer', '✅ Support Issue Resolved

Hi {{customerName}},

Great news! Your support issue has been resolved.

📋 Issue: {{issueDescription}}
✅ Resolution: {{resolution}}

If you have any further questions, please don''t hesitate to contact us.

Thank you for choosing LATS! 🚀', '["customerName", "issueDescription", "resolution"]', 'both', true),

-- Appointment Templates
('Appointment Reminder', 'appointment', '⏰ Appointment Reminder

Hi {{customerName}},

This is a friendly reminder about your upcoming appointment:

📅 Date: {{appointmentDate}}
⏰ Time: {{appointmentTime}}
📍 Location: {{location}}
🔧 Service: {{serviceName}}

Please arrive 10 minutes before your scheduled time.

To reschedule, call us at {{phoneNumber}}

Thank you,
LATS Team 🏥', '["customerName", "appointmentDate", "appointmentTime", "location", "serviceName", "phoneNumber"]', 'both', true),

-- Marketing Templates
('Promotional Offer', 'marketing', '🎉 Special Offer!

Hi {{customerName}},

We have a special offer just for you!

🎁 {{discountAmount}} off your next purchase
📅 Valid until {{validUntil}}
💳 Use code: {{promoCode}}

Don''t miss out on this amazing deal!

Visit our store or shop online to redeem your discount.

Thank you for choosing LATS! 🚀', '["customerName", "discountAmount", "validUntil", "promoCode"]', 'both', true),

-- Emergency Templates
('Emergency Alert', 'emergency', '🚨 Important Alert

Hi {{customerName}},

This is an important notification:

{{alertMessage}}

{{actionRequired}}

For immediate assistance, contact us at {{phoneNumber}}

Thank you for your understanding.

LATS Team 🚨', '["customerName", "alertMessage", "actionRequired", "phoneNumber"]', 'both', true),

-- General Templates
('General Notification', 'general', '📢 Important Update

Hi {{customerName}},

{{messageContent}}

{{additionalInfo}}

If you have any questions, please contact us.

Thank you,
LATS Team 📢', '["customerName", "messageContent", "additionalInfo"]', 'both', true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_templates_updated_at 
    BEFORE UPDATE ON whatsapp_message_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
