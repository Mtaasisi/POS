-- Fix SMS Tables Script
-- This script adds the missing SMS-related tables that are causing 404 errors

-- Create sms_logs table first (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT,
    cost DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES auth.users(id),
    device_id UUID REFERENCES devices(id)
);

-- Create sms_triggers table
CREATE TABLE IF NOT EXISTS public.sms_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('device_status_change', 'customer_registration', 'repair_complete', 'payment_received', 'custom')),
    conditions JSONB,
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_sms table
CREATE TABLE IF NOT EXISTS public.scheduled_sms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_trigger_logs table
CREATE TABLE IF NOT EXISTS public.sms_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id UUID REFERENCES sms_triggers(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    message_sent TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communication_templates table
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('sms', 'email', 'whatsapp')),
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_triggers_active ON sms_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_triggers_type ON sms_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_status ON scheduled_sms(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_scheduled_for ON scheduled_sms(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sms_trigger_logs_entity ON sms_trigger_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON communication_templates(template_type);

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_sms_triggers_updated_at ON sms_triggers;
CREATE TRIGGER update_sms_triggers_updated_at 
    BEFORE UPDATE ON sms_triggers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_sms_updated_at ON scheduled_sms;
CREATE TRIGGER update_scheduled_sms_updated_at 
    BEFORE UPDATE ON scheduled_sms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_templates_updated_at ON communication_templates;
CREATE TRIGGER update_communication_templates_updated_at 
    BEFORE UPDATE ON communication_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample SMS triggers
INSERT INTO sms_triggers (name, description, trigger_type, message_template, is_active) VALUES
('Device Status Update', 'Sends SMS when device status changes', 'device_status_change', 'Hi {customer_name}, your {device_brand} {device_model} status has been updated to {status}. Expected completion: {expected_date}.', true),
('Repair Complete', 'Sends SMS when repair is completed', 'repair_complete', 'Hi {customer_name}, your {device_brand} {device_model} repair is complete! Please collect your device. Thank you for choosing our service.', true),
('Payment Received', 'Sends SMS when payment is received', 'payment_received', 'Hi {customer_name}, we have received your payment of {amount} for {device_brand} {device_model}. Thank you!', true)
ON CONFLICT DO NOTHING;

-- Insert sample communication templates
INSERT INTO communication_templates (title, description, template_type, content, is_active) VALUES
('Welcome Message', 'Welcome message for new customers', 'sms', 'Welcome to our repair service! We''re here to help with your device repair needs.', true),
('Repair Update', 'Standard repair status update', 'sms', 'Your device repair is progressing well. We''ll keep you updated on any changes.', true),
('Collection Reminder', 'Reminder to collect completed device', 'sms', 'Your device repair is complete! Please collect it within 3 days. Thank you!', true)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_triggers TO authenticated;
GRANT ALL ON public.scheduled_sms TO authenticated;
GRANT ALL ON public.sms_trigger_logs TO authenticated;
GRANT ALL ON public.communication_templates TO authenticated;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all SMS logs" ON public.sms_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert SMS logs" ON public.sms_logs FOR INSERT WITH CHECK (auth.uid() = sent_by);

CREATE POLICY "Users can view all SMS triggers" ON public.sms_triggers FOR SELECT USING (true);
CREATE POLICY "Users can insert SMS triggers" ON public.sms_triggers FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own SMS triggers" ON public.sms_triggers FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all scheduled SMS" ON public.scheduled_sms FOR SELECT USING (true);
CREATE POLICY "Users can insert scheduled SMS" ON public.scheduled_sms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own scheduled SMS" ON public.scheduled_sms FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all SMS trigger logs" ON public.sms_trigger_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert SMS trigger logs" ON public.sms_trigger_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all communication templates" ON public.communication_templates FOR SELECT USING (true);
CREATE POLICY "Users can insert communication templates" ON public.communication_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own communication templates" ON public.communication_templates FOR UPDATE USING (auth.uid() = created_by);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✅ SMS tables created successfully!';
    RAISE NOTICE '📊 Tables added: sms_logs, sms_triggers, scheduled_sms, sms_trigger_logs, communication_templates';
    RAISE NOTICE '🔐 RLS policies configured for security';
    RAISE NOTICE '📝 Sample data inserted';
END $$; 