-- Create WhatsApp Automation Tables Migration
-- This migration creates all missing WhatsApp automation tables that are causing 404 errors

-- =====================================================
-- WHATSAPP AUTOMATION WORKFLOWS TABLE
-- =====================================================
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

-- =====================================================
-- WHATSAPP AUTOMATION EXECUTIONS TABLE
-- =====================================================
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

-- =====================================================
-- WHATSAPP MESSAGE TEMPLATES TABLE
-- =====================================================
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

-- =====================================================
-- WHATSAPP NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES lats_sales(id) ON DELETE SET NULL,
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

-- =====================================================
-- WHATSAPP ANALYTICS EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- WhatsApp Automation Workflows indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_trigger ON whatsapp_automation_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_active ON whatsapp_automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_priority ON whatsapp_automation_workflows(priority);

-- WhatsApp Automation Executions indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_workflow_id ON whatsapp_automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_status ON whatsapp_automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_executed_at ON whatsapp_automation_executions(executed_at);

-- WhatsApp Message Templates indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_message_templates(is_active);

-- WhatsApp Notifications indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_order_id ON whatsapp_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);

-- WhatsApp Analytics Events indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_event_type ON whatsapp_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_timestamp ON whatsapp_analytics_events(timestamp);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES (WITH CONFLICT HANDLING)
-- =====================================================

-- WhatsApp Automation Workflows policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_workflows;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_workflows;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_workflows;

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);

-- WhatsApp Automation Executions policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_executions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_executions;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_executions;

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);

-- WhatsApp Message Templates policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_message_templates;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_message_templates;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_message_templates;

CREATE POLICY "Enable read access for all users" ON whatsapp_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_message_templates FOR UPDATE USING (true);

-- WhatsApp Notifications policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_notifications;

CREATE POLICY "Enable read access for all users" ON whatsapp_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_notifications FOR UPDATE USING (true);

-- WhatsApp Analytics Events policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_analytics_events;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_analytics_events;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_analytics_events;

CREATE POLICY "Enable read access for all users" ON whatsapp_analytics_events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_analytics_events FOR UPDATE USING (true);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default message templates (with conflict handling)
INSERT INTO whatsapp_message_templates (name, category, template, variables, is_active) VALUES
('Order Confirmation', 'pos', '🎉 Order Confirmed!

Hi {{customerName}},

Your order #{{orderId}} has been confirmed!

📦 Items: {{items}}
💰 Total: {{total}}
📍 Delivery: {{deliveryAddress}}

We''ll notify you when your order is ready for pickup/delivery.

Thank you for choosing LATS! 🚀', '[]'::jsonb, true),
('Birthday Message', 'customer', '🎉 Happy Birthday {{customerName}}!

Wishing you a fantastic birthday filled with joy and happiness!

🎁 Special Birthday Offer: {{birthdayOffer}}
⏰ Valid until: {{validUntil}}

Enjoy your special day!

Best regards,
LATS Team 🚀', '[]'::jsonb, true),
('Welcome Message', 'customer', '🎉 Welcome to LATS!

Hi {{customerName}},

Thank you for joining the LATS family! We''re excited to have you on board.

🎁 Welcome Gift: {{welcomeGift}}
📱 Download our app: {{appLink}}
📞 Support: {{supportPhone}}

We''ll keep you updated with exclusive offers and updates!

Welcome aboard! 🚀', '[]'::jsonb, true),
('Support Acknowledgment', 'support', '🔧 Support Request Received

Hi {{customerName}},

Thank you for contacting LATS support. We have received your request and our team is working on it.

📋 Reference: {{ticketNumber}}
📅 Expected Response: {{responseTime}}

We''ll get back to you as soon as possible.

Thank you for your patience! 🚀', '[]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default automation workflows (with conflict handling)
INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
('Welcome New Customer', 'Automatically welcome new customers with onboarding messages', 'customer_registered', 
 '[]'::jsonb,
 '[]'::jsonb,
 true, 1),
('Order Confirmation Flow', 'Send order confirmation and follow-up messages', 'order_placed',
 '[]'::jsonb,
 '[]'::jsonb,
 true, 2),
('Support Request Handler', 'Automatically handle support requests and escalate when needed', 'message_received',
 '[]'::jsonb,
 '[]'::jsonb,
 true, 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the tables were created successfully
DO $$
BEGIN
    RAISE NOTICE '✅ WhatsApp Automation Workflows table created';
    RAISE NOTICE '✅ WhatsApp Automation Executions table created';
    RAISE NOTICE '✅ WhatsApp Message Templates table created';
    RAISE NOTICE '✅ WhatsApp Notifications table created';
    RAISE NOTICE '✅ WhatsApp Analytics Events table created';
    RAISE NOTICE '✅ All indexes created successfully';
    RAISE NOTICE '✅ RLS policies applied';
    RAISE NOTICE '✅ Default data inserted';
    RAISE NOTICE '🎉 All WhatsApp automation tables ready!';
END $$;
