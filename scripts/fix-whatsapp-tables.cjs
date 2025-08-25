const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWhatsAppTables() {
  console.log('🔧 Fixing WhatsApp automation tables...');

  try {
    // SQL migration to create missing WhatsApp tables
    const sqlMigration = `
-- Create WhatsApp Tables Migration (Final Clean Version)
-- This migration creates all missing WhatsApp automation tables

-- WhatsApp Automation Workflows Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    trigger VARCHAR(50) NOT NULL,
    conditions TEXT DEFAULT '[]',
    actions TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Automation Executions Table
CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    test_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Message Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    template TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Notifications Table
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES lats_sales(id) ON DELETE SET NULL,
    customer_phone VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Analytics Events Table
CREATE TABLE IF NOT EXISTS whatsapp_analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    event_data TEXT DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_trigger ON whatsapp_automation_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_workflows_active ON whatsapp_automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_workflow_id ON whatsapp_automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_executions_status ON whatsapp_automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_event_type ON whatsapp_analytics_events(event_type);

-- Enable RLS
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_workflows;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_workflows;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_workflows;

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_workflows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_workflows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_workflows FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_automation_executions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_automation_executions;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_automation_executions;

CREATE POLICY "Enable read access for all users" ON whatsapp_automation_executions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_automation_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_automation_executions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_message_templates;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_message_templates;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_message_templates;

CREATE POLICY "Enable read access for all users" ON whatsapp_message_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_message_templates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_notifications;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_notifications;

CREATE POLICY "Enable read access for all users" ON whatsapp_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON whatsapp_analytics_events;
DROP POLICY IF EXISTS "Enable insert access for all users" ON whatsapp_analytics_events;
DROP POLICY IF EXISTS "Enable update access for all users" ON whatsapp_analytics_events;

CREATE POLICY "Enable read access for all users" ON whatsapp_analytics_events FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON whatsapp_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON whatsapp_analytics_events FOR UPDATE USING (true);

-- Insert default data
INSERT INTO whatsapp_message_templates (name, category, template, variables, is_active) VALUES
('Order Confirmation', 'pos', 'Order Confirmed! Hi {{customerName}}, Your order has been confirmed!', '[]', true),
('Birthday Message', 'customer', 'Happy Birthday {{customerName}}! Wishing you a fantastic birthday!', '[]', true),
('Welcome Message', 'customer', 'Welcome to LATS! Hi {{customerName}}, Thank you for joining!', '[]', true),
('Support Acknowledgment', 'support', 'Support Request Received. Hi {{customerName}}, We have received your request.', '[]', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO whatsapp_automation_workflows (name, description, trigger, conditions, actions, is_active, priority) VALUES
('Welcome New Customer', 'Automatically welcome new customers', 'customer_registered', '[]', '[]', true, 1),
('Order Confirmation Flow', 'Send order confirmation messages', 'order_placed', '[]', '[]', true, 2),
('Support Request Handler', 'Handle support requests', 'message_received', '[]', '[]', true, 3)
ON CONFLICT (name) DO NOTHING;
`;

    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlMigration });

    if (error) {
      console.log('❌ Error executing SQL migration:', error.message);
      console.log('\n📋 Manual SQL Execution Required:');
      console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
      console.log('\n' + sqlMigration);
      return;
    }

    console.log('✅ WhatsApp automation tables created successfully!');
    console.log('✅ Default data inserted');
    console.log('✅ RLS policies applied');
    console.log('🎉 All WhatsApp automation tables are now ready!');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n📋 Manual SQL Execution Required:');
    console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + sqlMigration);
  }
}

// Run the script
fixWhatsAppTables();
