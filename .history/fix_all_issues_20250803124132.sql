-- Fix All Database Issues
-- This script addresses the 400 Bad Request and 404 Not Found errors

-- =============================================
-- STEP 1: FIX SMS LOGS TABLE
-- =============================================

-- Ensure sms_logs table exists with correct structure
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES auth.users(id),
    device_id UUID REFERENCES devices(id),
    cost DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add sent_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'sms_logs' 
                   AND column_name = 'sent_at') THEN
        ALTER TABLE sms_logs ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add error_message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'sms_logs' 
                   AND column_name = 'error_message') THEN
        ALTER TABLE sms_logs ADD COLUMN error_message TEXT;
    END IF;
    
    -- Add cost column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'sms_logs' 
                   AND column_name = 'cost') THEN
        ALTER TABLE sms_logs ADD COLUMN cost DECIMAL(10,4);
    END IF;
    
    -- Add device_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'sms_logs' 
                   AND column_name = 'device_id') THEN
        ALTER TABLE sms_logs ADD COLUMN device_id UUID REFERENCES devices(id);
    END IF;
END $$;

-- =============================================
-- STEP 2: CREATE DIAGNOSTIC TEMPLATES TABLE
-- =============================================

-- Create diagnostic_templates table
CREATE TABLE IF NOT EXISTS public.diagnostic_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_type TEXT NOT NULL,
    checklist_items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default diagnostic templates
INSERT INTO diagnostic_templates (device_type, checklist_items) VALUES
('Laptop', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen functionality"},
    {"id": "3", "name": "Keyboard Test", "description": "Test all keyboard keys"},
    {"id": "4", "name": "Touchpad Test", "description": "Test touchpad functionality"},
    {"id": "5", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "6", "name": "USB Ports Test", "description": "Test all USB ports"},
    {"id": "7", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "8", "name": "Battery Test", "description": "Check battery health"}
]'),
('Phone', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen and touch functionality"},
    {"id": "3", "name": "Camera Test", "description": "Test front and back cameras"},
    {"id": "4", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "5", "name": "Charging Test", "description": "Test charging port"},
    {"id": "6", "name": "SIM Card Test", "description": "Test SIM card functionality"},
    {"id": "7", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "8", "name": "Battery Test", "description": "Check battery health"}
]'),
('Tablet', '[
    {"id": "1", "name": "Power On Test", "description": "Check if device powers on"},
    {"id": "2", "name": "Display Test", "description": "Check screen and touch functionality"},
    {"id": "3", "name": "Camera Test", "description": "Test front and back cameras"},
    {"id": "4", "name": "Audio Test", "description": "Test speakers and microphone"},
    {"id": "5", "name": "Charging Test", "description": "Test charging port"},
    {"id": "6", "name": "WiFi Test", "description": "Test wireless connectivity"},
    {"id": "7", "name": "Battery Test", "description": "Check battery health"}
]')
ON CONFLICT (device_type) DO NOTHING;

-- =============================================
-- STEP 3: CREATE COMMUNICATION TEMPLATES TABLE
-- =============================================

-- Create communication_templates table
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    module TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SMS templates
INSERT INTO communication_templates (title, content, module, variables) VALUES
('Device Received', 'Dear {customer_name}, we have received your {device_brand} {device_model} for repair. Ticket: {ticket_number}. We will contact you once the repair is complete.', 'sms', ARRAY['customer_name', 'device_brand', 'device_model', 'ticket_number']),
('Device Ready', 'Dear {customer_name}, your {device_brand} {device_model} is ready for collection. Ticket: {ticket_number}. Please visit our shop to collect your device.', 'sms', ARRAY['customer_name', 'device_brand', 'device_model', 'ticket_number']),
('Payment Reminder', 'Dear {customer_name}, please complete payment for your {device_brand} {device_model} repair. Amount: {amount}. Ticket: {ticket_number}', 'sms', ARRAY['customer_name', 'device_brand', 'device_model', 'amount', 'ticket_number'])
ON CONFLICT (title) DO NOTHING;

-- =============================================
-- STEP 4: CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- SMS logs indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_device_id ON sms_logs(device_id);

-- Diagnostic templates indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);

-- Communication templates indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_module ON communication_templates(module);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);

-- =============================================
-- STEP 5: SETUP RLS POLICIES
-- =============================================

-- Enable RLS on tables
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

-- SMS logs policies
DROP POLICY IF EXISTS "Users can view their own SMS logs" ON sms_logs;
CREATE POLICY "Users can view their own SMS logs" ON sms_logs
    FOR SELECT USING (auth.uid() = sent_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

DROP POLICY IF EXISTS "Users can insert SMS logs" ON sms_logs;
CREATE POLICY "Users can insert SMS logs" ON sms_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own SMS logs" ON sms_logs;
CREATE POLICY "Users can update their own SMS logs" ON sms_logs
    FOR UPDATE USING (auth.uid() = sent_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

-- Diagnostic templates policies
DROP POLICY IF EXISTS "Users can view diagnostic templates" ON diagnostic_templates;
CREATE POLICY "Users can view diagnostic templates" ON diagnostic_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage diagnostic templates" ON diagnostic_templates;
CREATE POLICY "Admins can manage diagnostic templates" ON diagnostic_templates
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

-- Communication templates policies
DROP POLICY IF EXISTS "Users can view communication templates" ON communication_templates;
CREATE POLICY "Users can view communication templates" ON communication_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage communication templates" ON communication_templates;
CREATE POLICY "Admins can manage communication templates" ON communication_templates
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

-- =============================================
-- STEP 6: VERIFY FIXES
-- =============================================

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('sms_logs'),
        ('diagnostic_templates'),
        ('communication_templates')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public';

-- Check SMS logs structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'sms_logs'
ORDER BY ordinal_position;

-- Check if diagnostic templates have data
SELECT COUNT(*) as template_count FROM diagnostic_templates;

-- Check if communication templates have data
SELECT COUNT(*) as template_count FROM communication_templates; 