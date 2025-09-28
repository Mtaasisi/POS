-- Migration: Create Specification System Tables (Fixed)
-- Migration: 20250131000036_create_specification_system_clean.sql
-- This migration creates tables for managing specification categories and specifications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Specification Categories table
CREATE TABLE IF NOT EXISTS lats_specification_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id TEXT NOT NULL UNIQUE, -- e.g., 'laptop', 'mobile', 'monitor'
    name TEXT NOT NULL, -- e.g., 'Laptop', 'Mobile Phone', 'Monitor'
    icon TEXT DEFAULT 'Monitor', -- Icon name from Lucide React
    color TEXT DEFAULT 'blue', -- Color theme for the category
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_color CHECK (color IN ('blue', 'green', 'purple', 'orange', 'red', 'yellow', 'indigo', 'pink', 'gray')),
    CONSTRAINT valid_icon CHECK (icon IN ('Monitor', 'PhoneCall', 'Cable', 'Settings', 'HardDrive', 'Camera', 'Speaker', 'Headphones', 'Battery', 'Wifi', 'Cpu', 'Palette', 'Zap', 'FileText', 'Check', 'Hand', 'Lightbulb', 'Fingerprint', 'ScanFace', 'RotateCcw', 'PenTool', 'FastForward', 'BatteryCharging', 'Droplets', 'Wind', 'Shield', 'Usb', 'Bluetooth', 'Expand', 'Radio', 'Mic', 'Eye', 'Sun', 'Power', 'Ruler', 'Unplug', 'Navigation'))
);

-- Specifications table
CREATE TABLE IF NOT EXISTS lats_specifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES lats_specification_categories(id) ON DELETE CASCADE,
    spec_key TEXT NOT NULL, -- e.g., 'screen_size', 'ram', 'storage'
    name TEXT NOT NULL, -- e.g., 'Screen Size', 'RAM', 'Storage'
    type TEXT NOT NULL, -- 'text', 'number', 'boolean', 'select'
    icon TEXT DEFAULT 'Settings', -- Icon name from Lucide React
    options JSONB DEFAULT '[]', -- For select type specifications
    unit TEXT, -- e.g., 'inch', 'GB', 'kg'
    placeholder TEXT, -- Placeholder text for input fields
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_type CHECK (type IN ('text', 'number', 'boolean', 'select')),
    CONSTRAINT unique_spec_per_category UNIQUE (category_id, spec_key)
);

-- Product Specifications table (to store actual specification values for products)
CREATE TABLE IF NOT EXISTS lats_product_specifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    specification_id UUID NOT NULL REFERENCES lats_specifications(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- The actual specification value
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(product_id, specification_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spec_categories_active ON lats_specification_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_spec_categories_category_id ON lats_specification_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_specifications_category ON lats_specifications(category_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_specifications_type ON lats_specifications(type);
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON lats_product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_spec ON lats_product_specifications(specification_id);

-- Insert default specification categories
INSERT INTO lats_specification_categories (category_id, name, icon, color, description, sort_order) VALUES
('laptop', 'Laptop', 'Monitor', 'blue', 'Laptop computers and notebooks', 1),
('mobile', 'Mobile', 'PhoneCall', 'green', 'Mobile phones and smartphones', 2),
('monitor', 'Monitor', 'Monitor', 'purple', 'Computer monitors and displays', 3),
('tablet', 'Tablet', 'Monitor', 'orange', 'Tablet computers and iPads', 4),
('accessories', 'Accessories', 'Cable', 'gray', 'Computer accessories and peripherals', 5)
ON CONFLICT (category_id) DO NOTHING;

-- Insert ALL default specifications for laptop category
INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT 
    sc.id,
    spec_data.spec_key,
    spec_data.name,
    spec_data.type,
    spec_data.icon,
    spec_data.options,
    spec_data.unit,
    spec_data.placeholder,
    spec_data.sort_order
FROM lats_specification_categories sc,
(VALUES
    -- Text specifications
    ('processor', 'Processor', 'text', 'Cpu', '[]'::jsonb, NULL, 'Intel i5, AMD Ryzen 5', 1),
    ('graphics', 'Graphics', 'text', 'Monitor', '[]'::jsonb, NULL, 'Intel UHD, NVIDIA GTX', 2),
    ('color', 'Color', 'text', 'Palette', '[]'::jsonb, NULL, 'Silver, Black, Gold', 3),
    
    -- Number specifications
    ('high_refresh_rate', 'High Refresh Rate', 'number', 'RotateCcw', '[]'::jsonb, 'Hz', '60', 4),
    ('usb_c_ports', 'USB-C Ports', 'number', 'Usb', '[]'::jsonb, 'ports', '2', 5),
    ('usb_a_ports', 'USB-A Ports', 'number', 'Usb', '[]'::jsonb, 'ports', '2', 6),
    ('battery_life', 'Battery Life', 'number', 'Battery', '[]'::jsonb, 'hours', '8', 7),
    ('weight', 'Weight', 'number', 'Ruler', '[]'::jsonb, 'kg', '1.5', 8),
    ('thickness', 'Thickness', 'number', 'Ruler', '[]'::jsonb, 'mm', '15', 9),
    
    -- Select specifications
    ('screen_size', 'Screen Size', 'select', 'Monitor', '["11\"", "12\"", "13\"", "14\"", "15\"", "16\"", "17\"", "18\""]'::jsonb, 'inch', NULL, 10),
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD (1366x768)", "FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)"]'::jsonb, NULL, NULL, 11),
    ('ram', 'RAM', 'select', 'Zap', '["4GB", "8GB", "16GB", "32GB", "64GB"]'::jsonb, NULL, NULL, 12),
    ('storage', 'Storage', 'select', 'HardDrive', '["128GB", "256GB", "512GB", "1TB", "2TB"]'::jsonb, NULL, NULL, 13),
    ('storage_type', 'Storage Type', 'select', 'HardDrive', '["HDD", "SSD", "NVMe SSD"]'::jsonb, NULL, NULL, 14),
    ('wifi', 'Wi-Fi', 'select', 'Wifi', '["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]'::jsonb, NULL, NULL, 15),
    ('bluetooth', 'Bluetooth', 'select', 'Bluetooth', '["4.0", "5.0", "5.1", "5.2"]'::jsonb, NULL, NULL, 16),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]'::jsonb, NULL, NULL, 17),
    ('oled_display', 'OLED Display', 'boolean', 'Monitor', '[]'::jsonb, NULL, NULL, 18),
    ('backlit_keyboard', 'Backlit Keyboard', 'boolean', 'Lightbulb', '[]'::jsonb, NULL, NULL, 19),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]'::jsonb, NULL, NULL, 20),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]'::jsonb, NULL, NULL, 21),
    ('convertible', 'Convertible (2-in-1)', 'boolean', 'RotateCcw', '[]'::jsonb, NULL, NULL, 22),
    ('stylus_support', 'Stylus Support', 'boolean', 'PenTool', '[]'::jsonb, NULL, NULL, 23),
    ('hdmi_port', 'HDMI Port', 'boolean', 'Cable', '[]'::jsonb, NULL, NULL, 24),
    ('thunderbolt', 'Thunderbolt', 'boolean', 'Cable', '[]'::jsonb, NULL, NULL, 25),
    ('headphone_jack', 'Headphone Jack', 'boolean', 'Headphones', '[]'::jsonb, NULL, NULL, 26),
    ('fast_charging', 'Fast Charging', 'boolean', 'FastForward', '[]'::jsonb, NULL, NULL, 27),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]'::jsonb, NULL, NULL, 28),
    ('waterproof', 'Waterproof', 'boolean', 'Droplets', '[]'::jsonb, NULL, NULL, 29),
    ('dust_resistant', 'Dust Resistant', 'boolean', 'Wind', '[]'::jsonb, NULL, NULL, 30),
    ('military_grade', 'Military Grade', 'boolean', 'Shield', '[]'::jsonb, NULL, NULL, 31)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'laptop';

-- Enable Row Level Security (RLS)
ALTER TABLE lats_specification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_specifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for specification categories
CREATE POLICY "Enable read access for all users" ON lats_specification_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_specification_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_specification_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_specification_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for specifications
CREATE POLICY "Enable read access for all users" ON lats_specifications
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_specifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_specifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_specifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for product specifications
CREATE POLICY "Enable read access for all users" ON lats_product_specifications
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_product_specifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lats_product_specifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON lats_product_specifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_spec_categories_updated_at BEFORE UPDATE ON lats_specification_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON lats_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_specifications_updated_at BEFORE UPDATE ON lats_product_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the tables
COMMENT ON TABLE lats_specification_categories IS 'Categories for organizing product specifications (e.g., Laptop, Mobile, Monitor)';
COMMENT ON TABLE lats_specifications IS 'Individual specification fields for each category (e.g., Screen Size, RAM, Storage)';
COMMENT ON TABLE lats_product_specifications IS 'Actual specification values for specific products';
