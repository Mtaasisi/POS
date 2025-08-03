-- Diagnostic Tables Setup Script
-- Run this script in your Supabase SQL Editor to create the missing diagnostic tables

-- Create diagnostic_requests table
CREATE TABLE IF NOT EXISTS diagnostic_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id),
  device_id UUID REFERENCES devices(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic_devices table
CREATE TABLE IF NOT EXISTS diagnostic_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_request_id UUID NOT NULL REFERENCES diagnostic_requests(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  serial_number TEXT,
  model TEXT,
  notes TEXT,
  result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'passed', 'failed', 'partially_failed', 'submitted_for_review', 'repair_required', 'replacement_required', 'no_action_required', 'escalated', 'admin_reviewed', 'sent_to_care')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  admin_feedback TEXT,
  next_action TEXT CHECK (next_action IN ('repair', 'replace', 'ignore', 'escalate')),
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,
  feedback_submitted_by UUID REFERENCES auth.users(id),
  repair_completed_at TIMESTAMP WITH TIME ZONE,
  repair_notes TEXT,
  parts_used TEXT,
  repair_time TEXT
);

-- Create diagnostic_checks table
CREATE TABLE IF NOT EXISTS diagnostic_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_device_id UUID NOT NULL REFERENCES diagnostic_devices(id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  description TEXT,
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'failed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic_templates table
CREATE TABLE IF NOT EXISTS diagnostic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic-images table
CREATE TABLE IF NOT EXISTS "diagnostic-images" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_status ON diagnostic_requests(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_by ON diagnostic_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_assigned_to ON diagnostic_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_customer_id ON diagnostic_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_request_id ON diagnostic_devices(diagnostic_request_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_result_status ON diagnostic_devices(result_status);

CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);

CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);

-- Create trigger function for updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_diagnostic_requests_updated_at ON diagnostic_requests;
CREATE TRIGGER update_diagnostic_requests_updated_at 
    BEFORE UPDATE ON diagnostic_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostic_devices_updated_at ON diagnostic_devices;
CREATE TRIGGER update_diagnostic_devices_updated_at 
    BEFORE UPDATE ON diagnostic_devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostic_checks_updated_at ON diagnostic_checks;
CREATE TRIGGER update_diagnostic_checks_updated_at 
    BEFORE UPDATE ON diagnostic_checks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostic_templates_updated_at ON diagnostic_templates;
CREATE TRIGGER update_diagnostic_templates_updated_at 
    BEFORE UPDATE ON diagnostic_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE diagnostic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diagnostic-images" ENABLE ROW LEVEL SECURITY;

-- Create policies for diagnostic_requests table
CREATE POLICY "Enable read access for all users" ON diagnostic_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_requests FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for diagnostic_devices table
CREATE POLICY "Enable read access for all users" ON diagnostic_devices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_devices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_devices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_devices FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for diagnostic_checks table
CREATE POLICY "Enable read access for all users" ON diagnostic_checks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_checks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_checks FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for diagnostic_templates table
CREATE POLICY "Enable read access for all users" ON diagnostic_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_templates FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for diagnostic-images table
CREATE POLICY "Enable read access for all users" ON "diagnostic-images" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "diagnostic-images" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON "diagnostic-images" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON "diagnostic-images" FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample diagnostic templates
INSERT INTO diagnostic_templates (device_type, checklist_items) VALUES
('iPhone', '[
  {"id": "screen", "name": "Screen Test", "description": "Check for cracks, dead pixels, and touch responsiveness"},
  {"id": "battery", "name": "Battery Health", "description": "Test battery capacity and charging"},
  {"id": "camera", "name": "Camera Test", "description": "Test front and back cameras"},
  {"id": "speaker", "name": "Speaker Test", "description": "Test speaker and microphone"},
  {"id": "charging", "name": "Charging Port", "description": "Test charging port and wireless charging"},
  {"id": "buttons", "name": "Physical Buttons", "description": "Test volume, power, and home buttons"}
]'),
('Samsung', '[
  {"id": "screen", "name": "Screen Test", "description": "Check for cracks, dead pixels, and touch responsiveness"},
  {"id": "battery", "name": "Battery Health", "description": "Test battery capacity and charging"},
  {"id": "camera", "name": "Camera Test", "description": "Test front and back cameras"},
  {"id": "speaker", "name": "Speaker Test", "description": "Test speaker and microphone"},
  {"id": "charging", "name": "Charging Port", "description": "Test USB-C port and wireless charging"},
  {"id": "buttons", "name": "Physical Buttons", "description": "Test volume and power buttons"}
]'),
('Laptop', '[
  {"id": "screen", "name": "Display Test", "description": "Check for dead pixels and backlight issues"},
  {"id": "keyboard", "name": "Keyboard Test", "description": "Test all keys and backlight"},
  {"id": "trackpad", "name": "Trackpad Test", "description": "Test trackpad responsiveness"},
  {"id": "battery", "name": "Battery Test", "description": "Test battery health and charging"},
  {"id": "ports", "name": "Ports Test", "description": "Test USB, HDMI, and other ports"},
  {"id": "audio", "name": "Audio Test", "description": "Test speakers and microphone"}
]');

-- Success message
SELECT 'Diagnostic tables setup successful! All diagnostic tables created with sample templates.' as status; 