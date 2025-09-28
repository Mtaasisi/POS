-- Fix Missing Tables Migration
-- This migration creates all missing tables and views that are causing 404 errors
-- Migration: fix-missing-tables-migration.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE MISSING TABLES
-- =====================================================

-- 1. Create stock_movements table (alias for lats_stock_movements)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER DEFAULT 0,
    new_quantity INTEGER DEFAULT 0,
    reason TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sms_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    device_id UUID,
    customer_id UUID,
    template_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create uuid_diagnostic_log table (alias for diagnostic_checks)
CREATE TABLE IF NOT EXISTS uuid_diagnostic_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_device_id UUID NOT NULL,
    test_item TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
    remarks TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create whatsapp_templates table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('greeting', 'promotional', 'service', 'support', 'custom')) DEFAULT 'custom',
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    language TEXT CHECK (language IN ('en', 'sw', 'both')) DEFAULT 'both',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE WHATSAPP INSTANCES TABLE FIRST
-- =====================================================

-- 5. Create whatsapp_instances table if it doesn't exist
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT UNIQUE NOT NULL,
    api_token TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE MISSING VIEWS
-- =====================================================

-- 6. Create whatsapp_instance_settings_view
CREATE OR REPLACE VIEW whatsapp_instance_settings_view AS
SELECT 
    wi.id,
    wi.instance_id,
    wi.phone_number,
    wi.status,
    wi.created_at,
    wi.updated_at,
    -- Add any additional settings fields that might be needed
    '{}'::JSONB as settings
FROM whatsapp_instances wi;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);

-- Indexes for sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_device_id ON sms_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer_id ON sms_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

-- Indexes for uuid_diagnostic_log
CREATE INDEX IF NOT EXISTS idx_uuid_diagnostic_log_device_id ON uuid_diagnostic_log(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_uuid_diagnostic_log_result ON uuid_diagnostic_log(result);
CREATE INDEX IF NOT EXISTS idx_uuid_diagnostic_log_created_at ON uuid_diagnostic_log(created_at);

-- Indexes for whatsapp_instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone ON whatsapp_instances(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances(instance_id);

-- Indexes for whatsapp_templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON whatsapp_templates(language);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uuid_diagnostic_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Policies for stock_movements
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON stock_movements;
CREATE POLICY "Enable all access for authenticated users" ON stock_movements
    FOR ALL USING (true);

-- Policies for sms_logs
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_logs;
CREATE POLICY "Enable all access for authenticated users" ON sms_logs
    FOR ALL USING (true);

-- Policies for uuid_diagnostic_log
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON uuid_diagnostic_log;
CREATE POLICY "Enable all access for authenticated users" ON uuid_diagnostic_log
    FOR ALL USING (true);

-- Policies for whatsapp_instances
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON whatsapp_instances;
CREATE POLICY "Enable all access for authenticated users" ON whatsapp_instances
    FOR ALL USING (true);

-- Policies for whatsapp_templates
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON whatsapp_templates;
CREATE POLICY "Enable all access for authenticated users" ON whatsapp_templates
    FOR ALL USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated and anon users
GRANT ALL ON stock_movements TO authenticated;
GRANT ALL ON stock_movements TO anon;
GRANT ALL ON sms_logs TO authenticated;
GRANT ALL ON sms_logs TO anon;
GRANT ALL ON uuid_diagnostic_log TO authenticated;
GRANT ALL ON uuid_diagnostic_log TO anon;
GRANT ALL ON whatsapp_instances TO authenticated;
GRANT ALL ON whatsapp_instances TO anon;
GRANT ALL ON whatsapp_templates TO authenticated;
GRANT ALL ON whatsapp_templates TO anon;

-- Grant permissions for the view
GRANT SELECT ON whatsapp_instance_settings_view TO authenticated;
GRANT SELECT ON whatsapp_instance_settings_view TO anon;

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create or replace the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_uuid_diagnostic_log_updated_at 
    BEFORE UPDATE ON uuid_diagnostic_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at 
    BEFORE UPDATE ON whatsapp_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at 
    BEFORE UPDATE ON whatsapp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default WhatsApp templates if none exist
INSERT INTO whatsapp_templates (name, category, template, variables, language, is_active) VALUES
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

Reply STOP to unsubscribe', '["name", "date", "time", "location", "service"]', 'both', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    stock_movements_exists BOOLEAN;
    sms_logs_exists BOOLEAN;
    uuid_diagnostic_log_exists BOOLEAN;
    whatsapp_templates_exists BOOLEAN;
    whatsapp_view_exists BOOLEAN;
    template_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements'
    ) INTO stock_movements_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sms_logs'
    ) INTO sms_logs_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'uuid_diagnostic_log'
    ) INTO uuid_diagnostic_log_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_templates'
    ) INTO whatsapp_templates_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_instance_settings_view'
    ) INTO whatsapp_view_exists;
    
    -- Count templates
    SELECT COUNT(*) INTO template_count FROM whatsapp_templates;
    
    IF stock_movements_exists AND sms_logs_exists AND uuid_diagnostic_log_exists AND whatsapp_templates_exists AND whatsapp_view_exists THEN
        RAISE NOTICE '✅ All missing tables created successfully!';
        RAISE NOTICE '✅ stock_movements: %', stock_movements_exists;
        RAISE NOTICE '✅ sms_logs: %', sms_logs_exists;
        RAISE NOTICE '✅ uuid_diagnostic_log: %', uuid_diagnostic_log_exists;
        RAISE NOTICE '✅ whatsapp_templates: %', whatsapp_templates_exists;
        RAISE NOTICE '✅ whatsapp_instance_settings_view: %', whatsapp_view_exists;
        RAISE NOTICE '✅ Default templates created: %', template_count;
        RAISE NOTICE '✅ All 404 errors should be fixed!';
    ELSE
        RAISE NOTICE '❌ Failed to create some tables';
        RAISE NOTICE 'stock_movements: %', stock_movements_exists;
        RAISE NOTICE 'sms_logs: %', sms_logs_exists;
        RAISE NOTICE 'uuid_diagnostic_log: %', uuid_diagnostic_log_exists;
        RAISE NOTICE 'whatsapp_templates: %', whatsapp_templates_exists;
        RAISE NOTICE 'whatsapp_instance_settings_view: %', whatsapp_view_exists;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE stock_movements IS 'Stock movement records for inventory tracking';
COMMENT ON TABLE sms_logs IS 'SMS message logs for tracking sent messages';
COMMENT ON TABLE uuid_diagnostic_log IS 'Diagnostic test results for devices';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates for bulk messaging';
COMMENT ON VIEW whatsapp_instance_settings_view IS 'View for WhatsApp instance settings and configuration';
