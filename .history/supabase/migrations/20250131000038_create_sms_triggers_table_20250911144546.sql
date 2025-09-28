-- Create SMS triggers table for automatic SMS notifications
-- Migration: 20250131000038_create_sms_triggers_table.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sms_triggers table
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

-- Create sms_trigger_logs table for tracking trigger executions
CREATE TABLE IF NOT EXISTS sms_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id UUID REFERENCES sms_triggers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    template_id TEXT,
    recipient TEXT NOT NULL,
    result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'sent', 'failed', 'delivered')),
    error TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_templates table for SMS message templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_triggers_trigger_type ON sms_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_sms_triggers_is_active ON sms_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_trigger_id ON sms_trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_device_id ON sms_trigger_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_customer_id ON sms_trigger_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_created_at ON sms_trigger_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_templates(is_active);

-- Enable Row Level Security
ALTER TABLE sms_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_triggers;
CREATE POLICY "Enable all access for authenticated users" ON sms_triggers
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_trigger_logs;
CREATE POLICY "Enable all access for authenticated users" ON sms_trigger_logs
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sms_templates;
CREATE POLICY "Enable all access for authenticated users" ON sms_templates
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON sms_triggers TO authenticated;
GRANT ALL ON sms_triggers TO anon;
GRANT ALL ON sms_trigger_logs TO authenticated;
GRANT ALL ON sms_trigger_logs TO anon;
GRANT ALL ON sms_templates TO authenticated;
GRANT ALL ON sms_templates TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sms_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sms_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sms_triggers_updated_at ON sms_triggers;
CREATE TRIGGER trigger_update_sms_triggers_updated_at
    BEFORE UPDATE ON sms_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_triggers_updated_at();

DROP TRIGGER IF EXISTS trigger_update_sms_templates_updated_at ON sms_templates;
CREATE TRIGGER trigger_update_sms_templates_updated_at
    BEFORE UPDATE ON sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_templates_updated_at();

-- Add comments for documentation
COMMENT ON TABLE sms_triggers IS 'Automatic SMS triggers based on device status changes';
COMMENT ON TABLE sms_trigger_logs IS 'Log of SMS trigger executions and results';
COMMENT ON TABLE sms_templates IS 'SMS message templates for automated notifications';
COMMENT ON COLUMN sms_triggers.trigger_type IS 'Device status that triggers the SMS';
COMMENT ON COLUMN sms_triggers.condition IS 'Additional conditions for trigger execution (JSON)';
COMMENT ON COLUMN sms_trigger_logs.result IS 'Result of SMS sending attempt';

-- Insert default templates
INSERT INTO sms_templates (id, name, content, variables) VALUES
    (gen_random_uuid(), 'Device Received', 'Hi {customer_name}, we have received your {device_brand} {device_model} for repair. We will contact you once diagnosis is complete. Reference: {device_id}', '{"customer_name": "Customer name", "device_brand": "Device brand", "device_model": "Device model", "device_id": "Device ID"}'),
    (gen_random_uuid(), 'Diagnosis Started', 'Hi {customer_name}, we have started diagnosing your {device_brand} {device_model}. We will update you on the findings soon. Reference: {device_id}', '{"customer_name": "Customer name", "device_brand": "Device brand", "device_model": "Device model", "device_id": "Device ID"}'),
    (gen_random_uuid(), 'Repair Complete', 'Hi {customer_name}, your {device_brand} {device_model} repair is complete and ready for pickup! Please visit us to collect your device. Reference: {device_id}', '{"customer_name": "Customer name", "device_brand": "Device brand", "device_model": "Device model", "device_id": "Device ID"}')
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
    trigger_table_exists BOOLEAN;
    logs_table_exists BOOLEAN;
    templates_table_exists BOOLEAN;
    template_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sms_triggers'
    ) INTO trigger_table_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sms_trigger_logs'
    ) INTO logs_table_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sms_templates'
    ) INTO templates_table_exists;
    
    -- Count templates
    SELECT COUNT(*) INTO template_count FROM sms_templates;
    
    IF trigger_table_exists AND logs_table_exists AND templates_table_exists THEN
        RAISE NOTICE '✅ SMS triggers tables created successfully!';
        RAISE NOTICE '✅ SMS triggers: %', trigger_table_exists;
        RAISE NOTICE '✅ SMS trigger logs: %', logs_table_exists;
        RAISE NOTICE '✅ SMS templates: %', templates_table_exists;
        RAISE NOTICE '✅ Default templates created: %', template_count;
        RAISE NOTICE '✅ SMS trigger 404 error should be fixed!';
    ELSE
        RAISE NOTICE '❌ Failed to create SMS trigger tables';
        RAISE NOTICE 'sms_triggers exists: %', trigger_table_exists;
        RAISE NOTICE 'sms_trigger_logs exists: %', logs_table_exists;
        RAISE NOTICE 'sms_templates exists: %', templates_table_exists;
    END IF;
END $$;
