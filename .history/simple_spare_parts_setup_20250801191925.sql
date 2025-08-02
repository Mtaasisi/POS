-- Simple Spare Parts Setup
-- Run this in your Supabase SQL Editor

-- Create spare_parts table
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('screen', 'battery', 'camera', 'speaker', 'microphone', 'charging_port', 'motherboard', 'other')),
  brand TEXT,
  model_compatibility TEXT[],
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

-- Create spare_parts_usage table
CREATE TABLE IF NOT EXISTS spare_parts_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  device_id UUID,
  quantity_used INTEGER NOT NULL,
  used_by TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_brand ON spare_parts(brand);
CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_parts(is_active);

-- Insert sample data
INSERT INTO spare_parts (name, description, category, brand, model_compatibility, price, cost, stock_quantity, supplier, part_number) VALUES
('iPhone 15 Pro Screen', 'Original quality replacement screen for iPhone 15 Pro', 'screen', 'Apple', ARRAY['iPhone 15 Pro'], 299.99, 180.00, 15, 'TechParts Inc', 'IP15P-SCR-001'),
('iPhone 14 Screen', 'High-quality replacement screen for iPhone 14', 'screen', 'Apple', ARRAY['iPhone 14'], 249.99, 150.00, 20, 'TechParts Inc', 'IP14-SCR-001'),
('Galaxy S24 Screen', 'Original replacement screen for Samsung Galaxy S24', 'screen', 'Samsung', ARRAY['Galaxy S24'], 279.99, 170.00, 12, 'MobileParts Co', 'GS24-SCR-001'),
('iPhone 15 Battery', 'Original capacity battery for iPhone 15 series', 'battery', 'Apple', ARRAY['iPhone 15', 'iPhone 15 Plus'], 89.99, 45.00, 30, 'BatteryTech', 'IP15-BAT-001'),
('Galaxy S24 Battery', 'Original battery for Samsung Galaxy S24', 'battery', 'Samsung', ARRAY['Galaxy S24'], 69.99, 35.00, 25, 'BatteryTech', 'GS24-BAT-001'),
('iPhone 15 Pro Camera Module', 'Complete camera module for iPhone 15 Pro', 'camera', 'Apple', ARRAY['iPhone 15 Pro'], 199.99, 120.00, 10, 'CameraParts', 'IP15P-CAM-001'),
('iPhone Speaker Assembly', 'Speaker assembly for iPhone models', 'speaker', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 49.99, 25.00, 40, 'AudioParts', 'IP-SPK-001'),
('iPhone Charging Port', 'Lightning port assembly for iPhone', 'charging_port', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 39.99, 20.00, 50, 'PortParts', 'IP-PORT-001'),
('iPhone Microphone', 'Microphone assembly for iPhone', 'microphone', 'Apple', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13'], 29.99, 15.00, 60, 'MicParts', 'IP-MIC-001'),
('iPhone 15 Logic Board', 'Logic board for iPhone 15', 'motherboard', 'Apple', ARRAY['iPhone 15'], 599.99, 400.00, 5, 'BoardTech', 'IP15-LOG-001'),
('Screen Protector', 'Tempered glass screen protector', 'other', 'Generic', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy S24', 'Galaxy S23'], 9.99, 3.00, 200, 'ProtectorCo', 'SP-001'),
('Phone Case', 'Protective phone case', 'other', 'Generic', ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy S24', 'Galaxy S23'], 19.99, 8.00, 150, 'CaseCo', 'CASE-001');

-- Enable RLS
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON spare_parts_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON spare_parts_usage FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON spare_parts_usage FOR DELETE USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Spare parts tables created successfully with sample data!' as status; 