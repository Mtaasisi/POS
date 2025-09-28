-- Create Specification System Tables
-- Run this SQL in your Supabase Dashboard SQL Editor

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
    spec_data.options::jsonb,
    spec_data.unit,
    spec_data.placeholder,
    spec_data.sort_order
FROM lats_specification_categories sc,
(VALUES
    -- Text specifications
    ('screen_size', 'Screen Size', 'text', 'Monitor', '["13 inch", "14 inch", "15 inch", "17 inch"]', 'inch', 'Enter screen size', 1),
    ('processor', 'Processor', 'text', 'Settings', '["Intel i3", "Intel i5", "Intel i7", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7"]', '', 'Enter processor model', 2),
    ('operating_system', 'Operating System', 'text', 'Settings', '["Windows 10", "Windows 11", "macOS", "Linux", "Chrome OS"]', '', 'Enter OS', 3),
    ('graphics', 'Graphics Card', 'text', 'Monitor', '["Integrated", "NVIDIA GTX", "NVIDIA RTX", "AMD Radeon"]', '', 'Enter graphics card', 4),
    ('storage_type', 'Storage Type', 'text', 'HardDrive', '["HDD", "SSD", "NVMe SSD"]', '', 'Enter storage type', 5),
    ('color', 'Color', 'text', 'Settings', '["Black", "White", "Silver", "Gray", "Blue", "Red"]', '', 'Enter color', 6),
    ('model', 'Model', 'text', 'Settings', '[]', '', 'Enter model number', 7),
    ('brand', 'Brand', 'text', 'Settings', '["Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "Samsung"]', '', 'Enter brand', 8),
    
    -- Number specifications
    ('ram', 'RAM', 'number', 'Settings', '[]', 'GB', 'Enter RAM amount', 9),
    ('storage', 'Storage', 'number', 'HardDrive', '[]', 'GB', 'Enter storage capacity', 10),
    ('weight', 'Weight', 'number', 'Settings', '[]', 'kg', 'Enter weight', 11),
    ('battery_life', 'Battery Life', 'number', 'Battery', '[]', 'hours', 'Enter battery life', 12),
    
    -- Boolean specifications
    ('touchscreen', 'Touchscreen', 'boolean', 'Monitor', '[]', '', '', 13),
    ('backlit_keyboard', 'Backlit Keyboard', 'boolean', 'Settings', '[]', '', '', 14),
    ('webcam', 'Webcam', 'boolean', 'Camera', '[]', '', '', 15),
    ('bluetooth', 'Bluetooth', 'boolean', 'Settings', '[]', '', '', 16),
    ('wifi', 'WiFi', 'boolean', 'Wifi', '[]', '', '', 17),
    ('ethernet', 'Ethernet Port', 'boolean', 'Cable', '[]', '', '', 18),
    ('hdmi', 'HDMI Port', 'boolean', 'Cable', '[]', '', '', 19),
    ('usb_c', 'USB-C Port', 'boolean', 'Cable', '[]', '', '', 20)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO NOTHING;

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
    ('screen_size', 'Screen Size', 'text', 'Monitor', '["5 inch", "6 inch", "6.5 inch", "7 inch"]', 'inch', 'Enter screen size', 1),
    ('processor', 'Processor', 'text', 'Settings', '["Snapdragon", "MediaTek", "Exynos", "Apple A-series", "Kirin"]', '', 'Enter processor', 2),
    ('operating_system', 'Operating System', 'text', 'Settings', '["Android", "iOS", "HarmonyOS"]', '', 'Enter OS', 3),
    ('color', 'Color', 'text', 'Settings', '["Black", "White", "Blue", "Red", "Green", "Purple", "Gold", "Silver"]', '', 'Enter color', 4),
    ('model', 'Model', 'text', 'Settings', '[]', '', 'Enter model number', 5),
    ('brand', 'Brand', 'text', 'Settings', '["Samsung", "Apple", "Huawei", "Xiaomi", "Oppo", "Vivo", "OnePlus", "Google"]', '', 'Enter brand', 6),
    
    -- Number specifications
    ('ram', 'RAM', 'number', 'Settings', '[]', 'GB', 'Enter RAM amount', 7),
    ('storage', 'Storage', 'number', 'HardDrive', '[]', 'GB', 'Enter storage capacity', 8),
    ('battery', 'Battery', 'number', 'Battery', '[]', 'mAh', 'Enter battery capacity', 9),
    ('weight', 'Weight', 'number', 'Settings', '[]', 'g', 'Enter weight', 10),
    ('camera_megapixels', 'Camera', 'number', 'Camera', '[]', 'MP', 'Enter camera megapixels', 11),
    
    -- Boolean specifications
    ('dual_sim', 'Dual SIM', 'boolean', 'Settings', '[]', '', '', 12),
    ('nfc', 'NFC', 'boolean', 'Settings', '[]', '', '', 13),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'Battery', '[]', '', '', 14),
    ('fast_charging', 'Fast Charging', 'boolean', 'Battery', '[]', '', '', 15),
    ('water_resistant', 'Water Resistant', 'boolean', 'Settings', '[]', '', '', 16),
    ('fingerprint', 'Fingerprint Sensor', 'boolean', 'Settings', '[]', '', '', 17),
    ('face_unlock', 'Face Unlock', 'boolean', 'Camera', '[]', '', '', 18)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'mobile'
ON CONFLICT (category_id, spec_key) DO NOTHING;

-- Insert default specifications for monitor category
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
    ('screen_size', 'Screen Size', 'text', 'Monitor', '["21 inch", "24 inch", "27 inch", "32 inch", "34 inch"]', 'inch', 'Enter screen size', 1),
    ('resolution', 'Resolution', 'text', 'Monitor', '["1920x1080", "2560x1440", "3840x2160", "3440x1440"]', '', 'Enter resolution', 2),
    ('panel_type', 'Panel Type', 'text', 'Monitor', '["IPS", "VA", "TN", "OLED"]', '', 'Enter panel type', 3),
    ('color', 'Color', 'text', 'Settings', '["Black", "White", "Silver", "Gray"]', '', 'Enter color', 4),
    ('model', 'Model', 'text', 'Settings', '[]', '', 'Enter model number', 5),
    ('brand', 'Brand', 'text', 'Settings', '["Dell", "Samsung", "LG", "ASUS", "Acer", "BenQ", "ViewSonic"]', '', 'Enter brand', 6),
    
    -- Number specifications
    ('refresh_rate', 'Refresh Rate', 'number', 'Monitor', '[]', 'Hz', 'Enter refresh rate', 7),
    ('response_time', 'Response Time', 'number', 'Monitor', '[]', 'ms', 'Enter response time', 8),
    ('brightness', 'Brightness', 'number', 'Monitor', '[]', 'cd/m²', 'Enter brightness', 9),
    ('weight', 'Weight', 'number', 'Settings', '[]', 'kg', 'Enter weight', 10),
    
    -- Boolean specifications
    ('curved', 'Curved Display', 'boolean', 'Monitor', '[]', '', '', 11),
    ('hdr', 'HDR Support', 'boolean', 'Monitor', '[]', '', '', 12),
    ('g_sync', 'G-Sync', 'boolean', 'Monitor', '[]', '', '', 13),
    ('freesync', 'FreeSync', 'boolean', 'Monitor', '[]', '', '', 14),
    ('usb_hub', 'USB Hub', 'boolean', 'Cable', '[]', '', '', 15),
    ('speakers', 'Built-in Speakers', 'boolean', 'Speaker', '[]', '', '', 16),
    ('vesa_mount', 'VESA Mount', 'boolean', 'Settings', '[]', '', '', 17)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'monitor'
ON CONFLICT (category_id, spec_key) DO NOTHING;

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_spec_categories_updated_at BEFORE UPDATE ON lats_specification_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON lats_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_specifications_updated_at BEFORE UPDATE ON lats_product_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE lats_specification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_specifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to manage specification categories" ON lats_specification_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage specifications" ON lats_specifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage product specifications" ON lats_product_specifications FOR ALL USING (auth.role() = 'authenticated');

-- Add comments to document the tables
COMMENT ON TABLE lats_specification_categories IS 'Categories for organizing product specifications (e.g., Laptop, Mobile, Monitor)';
COMMENT ON TABLE lats_specifications IS 'Individual specification fields for each category (e.g., Screen Size, RAM, Storage)';
COMMENT ON TABLE lats_product_specifications IS 'Actual specification values for specific products';
