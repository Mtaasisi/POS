-- Complete Diagnostic Tables Setup Script
-- Run this script in your Supabase SQL Editor to create all missing tables

-- =============================================
-- STEP 1: CREATE CORE TABLES FIRST
-- =============================================

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  city TEXT,
  location_description TEXT,
  national_id TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  loyalty_level TEXT NOT NULL DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  color_tag TEXT NOT NULL DEFAULT 'normal' CHECK (color_tag IN ('normal', 'vip', 'complainer')),
  referred_by TEXT,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  whatsapp TEXT,
  birth_month TEXT,
  birth_day TEXT,
  referral_source TEXT,
  initial_notes TEXT,
  total_returns INTEGER DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 'done', 'failed')),
  assigned_to TEXT,
  estimated_hours INTEGER,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  warranty_start TIMESTAMP WITH TIME ZONE,
  warranty_end TIMESTAMP WITH TIME ZONE,
  warranty_status TEXT,
  repair_count INTEGER DEFAULT 0,
  last_return_date TIMESTAMP WITH TIME ZONE,
  unlock_code TEXT,
  repair_cost DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  device_cost DECIMAL(10,2),
  diagnosis_required BOOLEAN DEFAULT false,
  device_notes TEXT,
  device_condition JSONB,
  device_images JSONB,
  accessories_confirmed BOOLEAN DEFAULT false,
  problem_confirmed BOOLEAN DEFAULT false,
  privacy_confirmed BOOLEAN DEFAULT false,
  imei TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE DIAGNOSTIC TABLES
-- =============================================

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

-- =============================================
-- STEP 3: CREATE ADDITIONAL TABLES
-- =============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('device', 'customer', 'return', 'user', 'system')),
  entity_id TEXT,
  user_id TEXT,
  user_role TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spare_parts table for inventory management
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('screen', 'battery', 'camera', 'speaker', 'microphone', 'charging_port', 'motherboard', 'other')),
  brand TEXT,
  model_compatibility TEXT[], -- Array of compatible models
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  part_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spare_parts_usage table to track usage
CREATE TABLE IF NOT EXISTS spare_parts_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  used_by TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- =============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Device indexes
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);

-- Diagnostic indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_status ON diagnostic_requests(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_by ON diagnostic_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_assigned_to ON diagnostic_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_customer_id ON diagnostic_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_request_id ON diagnostic_devices(diagnostic_request_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_result_status ON diagnostic_devices(result_status);

CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);

CREATE INDEX IF NOT EXISTS idx_diagnostic_templates_device_type ON diagnostic_templates(device_type);

-- Audit and spare parts indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_brand ON spare_parts(brand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_parts(is_active);
CREATE INDEX IF NOT EXISTS idx_spare_parts_usage_part_id ON spare_parts_usage(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_usage_device_id ON spare_parts_usage(device_id);

-- =============================================
-- STEP 5: CREATE TRIGGERS
-- =============================================

-- Create trigger function for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS update_spare_parts_updated_at ON spare_parts;
CREATE TRIGGER update_spare_parts_updated_at 
    BEFORE UPDATE ON spare_parts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diagnostic-images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 7: CREATE RLS POLICIES
-- =============================================

-- Policies for customers table
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON customers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON customers FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for devices table
CREATE POLICY "Enable read access for all users" ON devices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON devices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON devices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON devices FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for diagnostic tables
CREATE POLICY "Enable read access for all users" ON diagnostic_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_requests FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON diagnostic_devices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_devices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_devices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_devices FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON diagnostic_checks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_checks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_checks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON diagnostic_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON diagnostic_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON diagnostic_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON diagnostic_templates FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON "diagnostic-images" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "diagnostic-images" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON "diagnostic-images" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON "diagnostic-images" FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for spare parts tables
CREATE POLICY "Enable read access for all users" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts_usage FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts_usage FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for audit_logs table
CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON audit_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON audit_logs FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- STEP 8: INSERT SAMPLE DATA
-- =============================================

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
SELECT 'Complete database setup successful! All tables created with proper relationships and sample data.' as status; 