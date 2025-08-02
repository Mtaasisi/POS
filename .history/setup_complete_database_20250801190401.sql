-- Complete Database Setup Script for Repair Shop Management System
-- Run this script in your Supabase SQL Editor to fix all missing tables

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

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

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

-- Create indexes for spare_parts
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_brand ON spare_parts(brand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_parts(is_active);

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

-- Create index for usage tracking
CREATE INDEX IF NOT EXISTS idx_spare_parts_usage_part_id ON spare_parts_usage(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_usage_device_id ON spare_parts_usage(device_id);

-- Create trigger function for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for spare_parts updated_at column
DROP TRIGGER IF EXISTS update_spare_parts_updated_at ON spare_parts;
CREATE TRIGGER update_spare_parts_updated_at 
    BEFORE UPDATE ON spare_parts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample spare parts data
INSERT INTO spare_parts (name, description, category, brand, model_compatibility, price, cost, stock_quantity, supplier, part_number) VALUES
-- iPhone Screens
('iPhone 15 Pro Screen', 'Original quality replacement screen for iPhone 15 Pro', 'screen', 'Apple', ARRAY['iPhone 15 Pro'], 299.99, 180.00, 15, 'TechParts Inc', 'IP15P-SCR-001'),
('iPhone 14 Screen', 'High-quality replacement screen for iPhone 14', 'screen', 'Apple', ARRAY['iPhone 14'], 249.99, 150.00, 20, 'TechParts Inc', 'IP14-SCR-001'),
('iPhone 13 Screen', 'OEM quality screen replacement for iPhone 13', 'screen', 'Apple', ARRAY['iPhone 13'], 199.99, 120.00, 25, 'TechParts Inc', 'IP13-SCR-001'),

-- Samsung Screens
('Galaxy S24 Screen', 'Original replacement screen for Samsung Galaxy S24', 'screen', 'Samsung', ARRAY['Galaxy S24'], 279.99, 170.00, 12, 'MobileParts Co', 'GS24-SCR-001'),
('Galaxy S23 Screen', 'High-quality screen for Samsung Galaxy S23', 'screen', 'Samsung', ARRAY['Galaxy S23'], 259.99, 160.00, 18, 'MobileParts Co', 'GS23-SCR-001'),

-- Batteries
('iPhone 15 Battery', 'Original capacity battery for iPhone 15 series', 'battery', 'Apple', ARRAY['iPhone 15', 'iPhone 15 Plus'], 89.99, 45.00, 30, 'BatteryTech', 'IP15-BAT-001'),
('iPhone 14 Battery', 'Replacement battery for iPhone 14 series', 'battery', 'Apple', ARRAY['iPhone 14', 'iPhone 14 Plus'], 79.99, 40.00, 35, 'BatteryTech', 'IP14-BAT-001'),
('Galaxy S24 Battery', 'Original battery for Samsung Galaxy S24', 'battery', 'Samsung', ARRAY['Galaxy S24'], 69.99, 35.00, 25, 'BatteryTech', 'GS24-BAT-001'),

-- Cameras
('iPhone 15 Pro Camera Module', 'Complete camera module for iPhone 15 Pro', 'camera', 'Apple', ARRAY['iPhone 15 Pro'], 199.99, 120.00, 10, 'CameraParts', 'IP15P-CAM-001'),
('Galaxy S24 Camera', 'Main camera module for Samsung Galaxy S24', 'camera', 'Samsung', ARRAY['Galaxy S24'], 179.99, 110.00, 8, 'CameraParts', 'GS24-CAM-001'),

-- Speakers
('iPhone Speaker Assembly', 'Speaker assembly for iPhone models', 'speaker', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 49.99, 25.00, 40, 'AudioParts', 'IP-SPK-001'),
('Samsung Speaker', 'Speaker replacement for Samsung devices', 'speaker', 'Samsung', ARRAY['Galaxy S24', 'Galaxy S23'], 39.99, 20.00, 35, 'AudioParts', 'SS-SPK-001'),

-- Charging Ports
('iPhone Charging Port', 'Lightning port assembly for iPhone', 'charging_port', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 39.99, 20.00, 50, 'PortParts', 'IP-PORT-001'),
('Samsung USB-C Port', 'USB-C charging port for Samsung devices', 'charging_port', 'Samsung', ARRAY['Galaxy S24', 'Galaxy S23'], 29.99, 15.00, 45, 'PortParts', 'SS-PORT-001'),

-- Microphones
('iPhone Microphone', 'Microphone assembly for iPhone', 'microphone', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 29.99, 15.00, 60, 'MicParts', 'IP-MIC-001'),
('Samsung Microphone', 'Microphone for Samsung devices', 'microphone', 'Samsung', ARRAY['Galaxy S24', 'Galaxy S23'], 24.99, 12.00, 55, 'MicParts', 'SS-MIC-001'),

-- Motherboards
('iPhone 15 Logic Board', 'Logic board for iPhone 15', 'motherboard', 'Apple', ARRAY['iPhone 15'], 599.99, 400.00, 5, 'BoardTech', 'IP15-LOG-001'),
('Galaxy S24 Motherboard', 'Main board for Samsung Galaxy S24', 'motherboard', 'Samsung', ARRAY['Galaxy S24'], 499.99, 350.00, 4, 'BoardTech', 'GS24-MB-001'),

-- Other Parts
('iPhone Home Button', 'Home button assembly for iPhone', 'other', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 19.99, 10.00, 70, 'ButtonParts', 'IP-HOME-001'),
('Samsung Volume Buttons', 'Volume button assembly for Samsung', 'other', 'Samsung', ARRAY['Galaxy S24', 'Galaxy S23'], 14.99, 8.00, 65, 'ButtonParts', 'SS-VOL-001'),
('Screen Protector', 'Tempered glass screen protector', 'other', 'Generic', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy S24', 'Galaxy S23'], 9.99, 3.00, 200, 'ProtectorCo', 'SP-001'),
('Phone Case', 'Protective phone case', 'other', 'Generic', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy S24', 'Galaxy S23'], 19.99, 8.00, 150, 'CaseCo', 'CASE-001');

-- Add comments for documentation
COMMENT ON TABLE spare_parts IS 'Inventory of spare parts for device repairs';
COMMENT ON TABLE spare_parts_usage IS 'Tracking of spare parts used in repairs';
COMMENT ON COLUMN spare_parts.model_compatibility IS 'Array of device models this part is compatible with';
COMMENT ON COLUMN spare_parts_usage.quantity_used IS 'Number of parts used in this repair';
COMMENT ON TABLE audit_logs IS 'System audit trail for all user actions';

-- Enable Row Level Security (RLS)
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for spare_parts table
CREATE POLICY "Enable read access for all users" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for spare_parts_usage table
CREATE POLICY "Enable read access for all users" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts_usage FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts_usage FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for audit_logs table
CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON audit_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON audit_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Complete database setup successful! All tables created with sample data.' as status; 