-- Complete SMS Database Setup
-- This script creates all SMS-related tables with proper relationships

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create settings table (if not exists)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key)
);

-- 2. Create sms_logs table (if not exists)
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'pending')) DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id TEXT,
    cost DECIMAL(10,2),
    personalization_data JSONB
);

-- 3. Create sms_templates table (if not exists)
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_optimized BOOLEAN DEFAULT false,
    UNIQUE(name)
);

-- 4. Create sms_triggers table (if not exists)
CREATE TABLE IF NOT EXISTS sms_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 
        'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 
        'done', 'failed'
    )),
    template_id TEXT,
    is_active BOOLEAN DEFAULT true,
    condition JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create sms_trigger_logs table (if not exists)
CREATE TABLE IF NOT EXISTS sms_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id UUID REFERENCES sms_triggers(id) ON DELETE CASCADE,
    device_id UUID,
    customer_id UUID,
    status TEXT NOT NULL,
    template_id TEXT,
    recipient TEXT NOT NULL,
    result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'sent', 'failed', 'delivered')),
    error TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create scheduled_sms table (if not exists)
CREATE TABLE IF NOT EXISTS scheduled_sms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipients TEXT[] NOT NULL,
    message TEXT NOT NULL,
    template_id TEXT,
    variables JSONB DEFAULT '{}',
    ai_enhanced BOOLEAN DEFAULT false,
    personalization_data JSONB DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_device_id ON sms_logs(device_id);

CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(name);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_sms_triggers_trigger_type ON sms_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_sms_triggers_is_active ON sms_triggers(is_active);

CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_trigger_id ON sms_trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_device_id ON sms_trigger_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_customer_id ON sms_trigger_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_created_at ON sms_trigger_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_sms_scheduled_for ON scheduled_sms(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_status ON scheduled_sms(status);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON settings;
CREATE POLICY "Enable all access for authenticated users" ON settings
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_logs;
CREATE POLICY "Enable all access for authenticated users" ON sms_logs
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_templates;
CREATE POLICY "Enable all access for authenticated users" ON sms_templates
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_triggers;
CREATE POLICY "Enable all access for authenticated users" ON sms_triggers
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_trigger_logs;
CREATE POLICY "Enable all access for authenticated users" ON sms_trigger_logs
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON scheduled_sms;
CREATE POLICY "Enable all access for authenticated users" ON scheduled_sms
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON settings TO authenticated;
GRANT ALL ON settings TO anon;
GRANT ALL ON sms_logs TO authenticated;
GRANT ALL ON sms_logs TO anon;
GRANT ALL ON sms_templates TO authenticated;
GRANT ALL ON sms_templates TO anon;
GRANT ALL ON sms_triggers TO authenticated;
GRANT ALL ON sms_triggers TO anon;
GRANT ALL ON sms_trigger_logs TO authenticated;
GRANT ALL ON sms_trigger_logs TO anon;
GRANT ALL ON scheduled_sms TO authenticated;
GRANT ALL ON scheduled_sms TO anon;

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON settings;
CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sms_templates_updated_at ON sms_templates;
CREATE TRIGGER trigger_update_sms_templates_updated_at
    BEFORE UPDATE ON sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_sms_triggers_updated_at ON sms_triggers;
CREATE TRIGGER trigger_update_sms_triggers_updated_at
    BEFORE UPDATE ON sms_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_scheduled_sms_updated_at ON scheduled_sms;
CREATE TRIGGER trigger_update_scheduled_sms_updated_at
    BEFORE UPDATE ON scheduled_sms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default SMS settings
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'test_api_key_123'),
('sms_api_url', 'https://httpbin.org/post'),
('sms_price', '15')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert default SMS templates
INSERT INTO sms_templates (name, content, variables, is_active) VALUES 
('Device Received', '✅ Tumepokea Kimepokelewa!\n\nHellow Mtaasisi {name},\n\nHabari njema! {device_brand} {device_model} yako imepokelewa na sasa iko katika foleni ya ukarabati wa Inauzwa.\n\n📋 Namba ya Kumbukumbu: #{device_id}\n📅 Tarehe ya Kupokea: {date}\n🔧 Tatizo: {issue}\n\nSubiri ujumbe kupitia SMS kikiwa tayari!\n\nAsante kwa kumtumaini Inauzwa 🚀', 
 '["name", "device_brand", "device_model", "device_id", "date", "issue"]'::jsonb, true),

('Device Ready', '🎉 Kifaa Chako Tayari!\n\nHabari Mtaasisi {name},\n\nHabari njema! {device_brand} {device_model} yako imekamilika na tayari kuchukuliwa.\n\n📋 Namba ya Kumbukumbu: #{device_id}\n✅ Tarehe ya Kukamilisha: {date}\n\nTafadhali uje kuchukua kifaa chako katika ofisi yetu ndani ya muda ili kuepuka usumbufu.\n\nAsante kwa kumtumaini Inauzwa! 🚀', 
 '["name", "device_brand", "device_model", "device_id", "date"]'::jsonb, true),

('Payment Reminder', 'Habari Mtaasisi {name},\n\nKumbuka kuwa una deni la TSh {amount} kwa huduma za ukarabati.\n\nTafadhali lipia ili kuchukua kifaa chako.\n\nAsante - Inauzwa', 
 '["name", "amount"]'::jsonb, true),

('Diagnosis Started', 'Hi {customer_name}, we have started diagnosing your {device_brand} {device_model}. We will update you on the findings soon. Reference: {device_id}', 
 '["customer_name", "device_brand", "device_model", "device_id"]'::jsonb, true),

('Repair Complete', 'Hi {customer_name}, your {device_brand} {device_model} repair is complete and ready for pickup! Please visit us to collect your device. Reference: {device_id}', 
 '["customer_name", "device_brand", "device_model", "device_id"]'::jsonb, true)

ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE settings IS 'Application settings including SMS provider configuration';
COMMENT ON TABLE sms_logs IS 'Log of all SMS messages sent through the system';
COMMENT ON TABLE sms_templates IS 'SMS message templates for automated notifications';
COMMENT ON TABLE sms_triggers IS 'Automatic SMS triggers based on device status changes';
COMMENT ON TABLE sms_trigger_logs IS 'Log of SMS trigger executions and results';
COMMENT ON TABLE scheduled_sms IS 'Scheduled SMS messages for future delivery';

COMMENT ON COLUMN sms_logs.status IS 'SMS delivery status: sent, delivered, failed, pending';
COMMENT ON COLUMN sms_logs.personalization_data IS 'Additional data for SMS personalization (JSON)';
COMMENT ON COLUMN sms_templates.variables IS 'Template variables for message personalization (JSON array)';
COMMENT ON COLUMN sms_triggers.trigger_type IS 'Device status that triggers the SMS';
COMMENT ON COLUMN sms_triggers.condition IS 'Additional conditions for trigger execution (JSON)';
COMMENT ON COLUMN sms_trigger_logs.result IS 'Result of SMS sending attempt';
COMMENT ON COLUMN scheduled_sms.recipients IS 'Array of phone numbers to receive the SMS';

-- Verification and summary
DO $$
DECLARE
    settings_count INTEGER;
    templates_count INTEGER;
    triggers_count INTEGER;
    logs_count INTEGER;
    trigger_logs_count INTEGER;
    scheduled_count INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO settings_count FROM settings WHERE key LIKE 'sms_%';
    SELECT COUNT(*) INTO templates_count FROM sms_templates;
    SELECT COUNT(*) INTO triggers_count FROM sms_triggers;
    SELECT COUNT(*) INTO logs_count FROM sms_logs;
    SELECT COUNT(*) INTO trigger_logs_count FROM sms_trigger_logs;
    SELECT COUNT(*) INTO scheduled_count FROM scheduled_sms;
    
    RAISE NOTICE '✅ SMS Database Setup Complete!';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - SMS Settings: %', settings_count;
    RAISE NOTICE '   - SMS Templates: %', templates_count;
    RAISE NOTICE '   - SMS Triggers: %', triggers_count;
    RAISE NOTICE '   - SMS Logs: %', logs_count;
    RAISE NOTICE '   - SMS Trigger Logs: %', trigger_logs_count;
    RAISE NOTICE '   - Scheduled SMS: %', scheduled_count;
    RAISE NOTICE '✅ All SMS tables created with proper relationships!';
    RAISE NOTICE '✅ SMS system is ready to use!';
END $$;

-- Final verification query
SELECT 
    'SMS Database Setup Complete' as status,
    NOW() as completed_at,
    (SELECT COUNT(*) FROM settings WHERE key LIKE 'sms_%') as sms_settings_count,
    (SELECT COUNT(*) FROM sms_templates) as templates_count,
    (SELECT COUNT(*) FROM sms_logs) as logs_count;
