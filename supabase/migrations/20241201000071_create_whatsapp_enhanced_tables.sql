-- Enhanced WhatsApp Tables Migration
-- This migration creates all the necessary tables for the enhanced WhatsApp Hub features

-- 1. WhatsApp Notifications Table (for tracking all notifications)
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    customer_phone VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WhatsApp Messages Table (for tracking all messages)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video')),
    content TEXT,
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WhatsApp Message Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('pos', 'customer', 'support', 'marketing', 'general')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WhatsApp Automation Workflows Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('message_received', 'order_placed', 'customer_registered', 'appointment_scheduled', 'payment_received')),
    conditions JSONB DEFAULT '[]',
    actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WhatsApp Automation Executions Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'test')),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    test_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. WhatsApp Analytics Events Table
CREATE TABLE IF NOT EXISTS whatsapp_analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_order_id ON whatsapp_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_message_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_trigger ON whatsapp_automation_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_active ON whatsapp_automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_priority ON whatsapp_automation_workflows(priority);

CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_workflow_id ON whatsapp_automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_status ON whatsapp_automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_executed_at ON whatsapp_automation_executions(executed_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_event_type ON whatsapp_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_timestamp ON whatsapp_analytics_events(timestamp);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_notifications_updated_at 
    BEFORE UPDATE ON whatsapp_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at 
    BEFORE UPDATE ON whatsapp_message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_workflows_updated_at 
    BEFORE UPDATE ON whatsapp_automation_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO whatsapp_message_templates (name, category, template, variables, is_active) VALUES
-- POS Templates
('Order Confirmation', 'pos', '🎉 Order Confirmed!\n\nHi {{customerName}},\n\nYour order #{{orderId}} has been confirmed!\n\n📦 Items: {{items}}\n💰 Total: {{total}}\n📍 Delivery: {{deliveryAddress}}\n\nWe''ll notify you when your order is ready for pickup/delivery.\n\nThank you for choosing LATS! 🚀', '["customerName", "orderId", "items", "total", "deliveryAddress"]', true),
('Status Update', 'pos', '📦 Order Status Update\n\nHi {{customerName}},\n\nYour order #{{orderId}} status: {{status}}\n\n{{statusDetails}}\n\nExpected completion: {{expectedDate}}\n\nThank you for your patience! 🚀', '["customerName", "orderId", "status", "statusDetails", "expectedDate"]', true),
('Delivery Update', 'pos', '🚚 Delivery Update\n\nHi {{customerName}},\n\nYour order #{{orderId}} is on its way!\n\n📦 Items: {{items}}\n🚚 Driver: {{driverName}}\n📱 Contact: {{driverPhone}}\n⏰ ETA: {{eta}}\n\nTrack your delivery: {{trackingLink}}\n\nThank you! 🚀', '["customerName", "orderId", "items", "driverName", "driverPhone", "eta", "trackingLink"]', true),
('Payment Reminder', 'pos', '💳 Payment Reminder\n\nHi {{customerName}},\n\nThis is a friendly reminder about your pending payment for order #{{orderId}}.\n\n💰 Amount Due: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPayment Methods:\n💳 Card: {{cardPaymentLink}}\n💵 Cash: Pay at our store\n📱 Mobile Money: {{mobileMoneyNumber}}\n\nThank you! 🚀', '["customerName", "orderId", "amount", "dueDate", "cardPaymentLink", "mobileMoneyNumber"]', true),

-- Customer Templates
('Birthday Message', 'customer', '🎉 Happy Birthday {{customerName}}!\n\nWe hope your special day is filled with joy and happiness! 🎂\n\nAs a valued customer, we''d like to offer you a special birthday discount:\n\n🎁 {{discountAmount}} off your next purchase\n📅 Valid until {{validUntil}}\n\nVisit our store or shop online to redeem your birthday gift!\n\nThank you for choosing LATS! 🚀', '["customerName", "discountAmount", "validUntil"]', true),
('Loyalty Update', 'customer', '👑 Loyalty Update\n\nHi {{customerName}},\n\nGreat news! You''ve earned {{pointsEarned}} points from your recent purchase!\n\n🏆 Current Points: {{currentPoints}}\n🎯 Next Reward: {{nextReward}} points needed\n\nYour loyalty level: {{loyaltyLevel}}\n\nKeep shopping to unlock more rewards! 🚀', '["customerName", "pointsEarned", "currentPoints", "nextReward", "loyaltyLevel"]', true),
('Appointment Reminder', 'customer', '⏰ Appointment Reminder\n\nHi {{customerName}},\n\nThis is a friendly reminder about your upcoming appointment:\n\n📅 Date: {{appointmentDate}}\n🕐 Time: {{appointmentTime}}\n📍 Location: {{location}}\n👨‍⚕️ Service: {{service}}\n\nPlease arrive 10 minutes before your scheduled time.\n\nTo reschedule, call us at {{phoneNumber}}\n\nThank you,\nLATS Team 🏥', '["customerName", "appointmentDate", "appointmentTime", "location", "service", "phoneNumber"]', true),
('Welcome Message', 'customer', '🎉 Welcome to LATS!\n\nHi {{customerName}},\n\nThank you for joining the LATS family! We''re excited to have you on board.\n\n🎁 Welcome Gift: {{welcomeGift}}\n📱 Download our app: {{appLink}}\n📞 Support: {{supportPhone}}\n\nWe''ll keep you updated with exclusive offers and updates!\n\nWelcome aboard! 🚀', '["customerName", "welcomeGift", "appLink", "supportPhone"]', true),

-- Support Templates
('Support Acknowledgment', 'support', '🔧 Support Request Received\n\nHi {{customerName}},\n\nThank you for contacting LATS support. We have received your request and our team is working on it.\n\n📋 Reference: {{ticketNumber}}\n📅 Expected Response: {{responseTime}}\n\nWe''ll get back to you as soon as possible.\n\nThank you for your patience! 🚀', '["customerName", "ticketNumber", "responseTime"]', true),
('Support Resolution', 'support', '✅ Support Issue Resolved\n\nHi {{customerName}},\n\nGreat news! Your support issue has been resolved.\n\n📋 Issue: {{issueDescription}}\n✅ Resolution: {{resolution}}\n\nIf you have any further questions, please don''t hesitate to contact us.\n\nThank you for choosing LATS! 🚀', '["customerName", "issueDescription", "resolution"]', true);

-- Insert default automation workflows
INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
('Welcome New Customer', 'Automatically welcome new customers with onboarding messages', 'customer_registered', 
 '[{"id": "1", "field": "customer_type", "operator": "equals", "value": "new"}]',
 '[{"id": "1", "type": "send_message", "config": {"template": "welcome_message", "delay": 0}}, {"id": "2", "type": "wait", "config": {}, "delay": 60}, {"id": "3", "type": "send_message", "config": {"template": "onboarding_followup", "delay": 0}}]',
 true, 1),
('Order Confirmation Flow', 'Send order confirmation and follow-up messages', 'order_placed',
 '[{"id": "1", "field": "order_amount", "operator": "greater_than", "value": "0"}]',
 '[{"id": "1", "type": "send_message", "config": {"template": "order_confirmation", "delay": 0}}, {"id": "2", "type": "wait", "config": {}, "delay": 1440}, {"id": "3", "type": "send_message", "config": {"template": "order_status_update", "delay": 0}}]',
 true, 2),
('Support Request Handler', 'Automatically handle support requests and escalate when needed', 'message_received',
 '[{"id": "1", "field": "message_content", "operator": "contains", "value": "help"}]',
 '[{"id": "1", "type": "send_message", "config": {"template": "support_acknowledgment", "delay": 0}}, {"id": "2", "type": "create_task", "config": {"task_type": "support_ticket", "priority": "medium"}}]',
 true, 3);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these based on your needs)
CREATE POLICY "Enable read access for all users" ON whatsapp_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_notifications FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_messages FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_message_templates FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON whatsapp_analytics_events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_analytics_events FOR UPDATE USING (true);
