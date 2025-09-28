-- Migration: Create Specification System Tables
-- Migration: 20250131000035_create_specification_system.sql
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
    CONSTRAINT valid_icon CHECK (icon IN ('Monitor', 'PhoneCall', 'Cable', 'Settings', 'HardDrive', 'Camera', 'Speaker', 'Headphones', 'Battery', 'Wifi'))
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

-- Insert default specifications for laptop category
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
    ('processor', 'Processor', 'text', 'Cpu', '[]', NULL, 'Intel i5, AMD Ryzen 5', 1),
    ('graphics', 'Graphics', 'text', 'Monitor', '[]', NULL, 'Intel UHD, NVIDIA GTX', 2),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Silver, Black, Gold', 3),
    
    -- Number specifications
    ('screen_size', 'Screen Size', 'number', 'Monitor', '[]', 'inch', '15.6', 4),
    ('ram', 'RAM', 'number', 'Zap', '[]', 'GB', '8', 5),
    ('storage', 'Storage', 'number', 'HardDrive', '[]', 'GB', '256', 6),
    ('weight', 'Weight', 'number', 'Ruler', '[]', 'kg', '1.5', 7),
    
    -- Select specifications
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD (1366x768)", "FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)"]', NULL, NULL, 8),
    ('storage_type', 'Storage Type', 'select', 'HardDrive', '["HDD", "SSD", "NVMe SSD"]', NULL, NULL, 9),
    ('wifi', 'Wi-Fi', 'select', 'Wifi', '["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]', NULL, NULL, 10),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 11),
    ('backlit_keyboard', 'Backlit Keyboard', 'boolean', 'Lightbulb', '[]', NULL, NULL, 12),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]', NULL, NULL, 13),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]', NULL, NULL, 14)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'laptop';

-- Insert default specifications for mobile category
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
    ('processor', 'Processor', 'text', 'Cpu', '[]', NULL, 'Snapdragon 888, A15 Bionic', 1),
    ('rear_camera', 'Rear Camera', 'text', 'Camera', '[]', NULL, '48MP + 12MP + 5MP', 2),
    ('front_camera', 'Front Camera', 'text', 'Camera', '[]', NULL, '12MP', 3),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Black, White, Blue', 4),
    
    -- Number specifications
    ('screen_size', 'Screen Size', 'number', 'Monitor', '[]', 'inch', '6.1', 5),
    ('ram', 'RAM', 'number', 'Zap', '[]', 'GB', '8', 6),
    ('storage', 'Storage', 'number', 'HardDrive', '[]', 'GB', '128', 7),
    ('battery_capacity', 'Battery Capacity', 'number', 'Battery', '[]', 'mAh', '4000', 8),
    
    -- Select specifications
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD+", "FHD+", "QHD+", "4K"]', NULL, NULL, 9),
    ('display_type', 'Display Type', 'select', 'Monitor', '["LCD", "OLED", "AMOLED", "Super AMOLED"]', NULL, NULL, 10),
    ('refresh_rate', 'Refresh Rate', 'select', 'RotateCcw', '["60Hz", "90Hz", "120Hz", "144Hz"]', NULL, NULL, 11),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 12),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]', NULL, NULL, 13),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]', NULL, NULL, 14),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 15),
    ('5g_support', '5G Support', 'boolean', 'Radio', '[]', NULL, NULL, 16)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'mobile';

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
