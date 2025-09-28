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
    ('screen_size', 'Screen Size', 'select', 'Monitor', '["11\"", "12\"", "13\"", "14\"", "15\"", "16\"", "17\"", "18\""]', 'inch', NULL, 10),
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD (1366x768)", "FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)"]', NULL, NULL, 11),
    ('ram', 'RAM', 'select', 'Zap', '["4GB", "8GB", "16GB", "32GB", "64GB"]', NULL, NULL, 12),
    ('storage', 'Storage', 'select', 'HardDrive', '["128GB", "256GB", "512GB", "1TB", "2TB"]', NULL, NULL, 13),
    ('storage_type', 'Storage Type', 'select', 'HardDrive', '["HDD", "SSD", "NVMe SSD"]', NULL, NULL, 14),
    ('wifi', 'Wi-Fi', 'select', 'Wifi', '["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]', NULL, NULL, 15),
    ('bluetooth', 'Bluetooth', 'select', 'Bluetooth', '["4.0", "5.0", "5.1", "5.2"]', NULL, NULL, 16),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 17),
    ('oled_display', 'OLED Display', 'boolean', 'Monitor', '[]', NULL, NULL, 18),
    ('backlit_keyboard', 'Backlit Keyboard', 'boolean', 'Lightbulb', '[]', NULL, NULL, 19),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]', NULL, NULL, 20),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]', NULL, NULL, 21),
    ('convertible', 'Convertible (2-in-1)', 'boolean', 'RotateCcw', '[]', NULL, NULL, 22),
    ('stylus_support', 'Stylus Support', 'boolean', 'PenTool', '[]', NULL, NULL, 23),
    ('hdmi_port', 'HDMI Port', 'boolean', 'Cable', '[]', NULL, NULL, 24),
    ('thunderbolt', 'Thunderbolt', 'boolean', 'Cable', '[]', NULL, NULL, 25),
    ('headphone_jack', 'Headphone Jack', 'boolean', 'Headphones', '[]', NULL, NULL, 26),
    ('fast_charging', 'Fast Charging', 'boolean', 'FastForward', '[]', NULL, NULL, 27),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 28),
    ('waterproof', 'Waterproof', 'boolean', 'Droplets', '[]', NULL, NULL, 29),
    ('dust_resistant', 'Dust Resistant', 'boolean', 'Wind', '[]', NULL, NULL, 30),
    ('military_grade', 'Military Grade', 'boolean', 'Shield', '[]', NULL, NULL, 31)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'laptop';

-- Insert ALL default specifications for mobile category
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
    ('fast_charging', 'Fast Charging', 'text', 'FastForward', '[]', NULL, '25W, 45W, 65W', 4),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Black, White, Blue', 5),
    
    -- Number specifications
    ('screen_size', 'Screen Size', 'number', 'Monitor', '[]', 'inch', '6.1', 6),
    ('optical_zoom', 'Optical Zoom', 'number', 'Camera', '[]', 'x', '3', 7),
    ('weight', 'Weight', 'number', 'Ruler', '[]', 'g', '180', 8),
    ('thickness', 'Thickness', 'number', 'Ruler', '[]', 'mm', '8.1', 9),
    ('battery_capacity', 'Battery Capacity', 'number', 'Battery', '[]', 'mAh', '4000', 10),
    ('battery_life', 'Battery Life', 'number', 'Battery', '[]', 'hours', '24', 11),
    
    -- Select specifications
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD+", "FHD+", "QHD+", "4K"]', NULL, NULL, 12),
    ('display_type', 'Display Type', 'select', 'Monitor', '["LCD", "OLED", "AMOLED", "Super AMOLED"]', NULL, NULL, 13),
    ('refresh_rate', 'Refresh Rate', 'select', 'RotateCcw', '["60Hz", "90Hz", "120Hz", "144Hz"]', NULL, NULL, 14),
    ('ram', 'RAM', 'select', 'Zap', '["4GB", "6GB", "8GB", "12GB", "16GB"]', NULL, NULL, 15),
    ('storage', 'Storage', 'select', 'HardDrive', '["64GB", "128GB", "256GB", "512GB", "1TB"]', NULL, NULL, 16),
    ('video_recording', 'Video Recording', 'select', 'Camera', '["4K@30fps", "4K@60fps", "8K@30fps"]', NULL, NULL, 17),
    ('waterproof', 'Waterproof', 'select', 'Droplets', '["IP67", "IP68"]', NULL, NULL, 18),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 19),
    ('expandable_storage', 'Expandable Storage', 'boolean', 'Expand', '[]', NULL, NULL, 20),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]', NULL, NULL, 21),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]', NULL, NULL, 22),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 23),
    ('reverse_charging', 'Reverse Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 24),
    ('nfc', 'NFC', 'boolean', 'Radio', '[]', NULL, NULL, 25),
    ('5g_support', '5G Support', 'boolean', 'Radio', '[]', NULL, NULL, 26),
    ('stereo_speakers', 'Stereo Speakers', 'boolean', 'Speaker', '[]', NULL, NULL, 27),
    ('headphone_jack', 'Headphone Jack', 'boolean', 'Headphones', '[]', NULL, NULL, 28),
    ('noise_cancellation', 'Noise Cancellation', 'boolean', 'Mic', '[]', NULL, NULL, 29),
    ('dust_resistant', 'Dust Resistant', 'boolean', 'Wind', '[]', NULL, NULL, 30),
    ('drop_resistant', 'Drop Resistant', 'boolean', 'Shield', '[]', NULL, NULL, 31)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'mobile';

-- Insert ALL default specifications for monitor category
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
    ('color_accuracy', 'Color Accuracy', 'text', 'Palette', '[]', NULL, 'ΔE < 2', 1),
    ('contrast_ratio', 'Contrast Ratio', 'text', 'Eye', '[]', NULL, '1000:1', 2),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Black, White, Silver', 3),
    
    -- Number specifications
    ('response_time', 'Response Time', 'number', 'Zap', '[]', 'ms', '1', 4),
    ('brightness', 'Brightness', 'number', 'Sun', '[]', 'nits', '300', 5),
    ('hdmi_ports', 'HDMI Ports', 'number', 'Cable', '[]', 'ports', '2', 6),
    ('displayport_ports', 'DisplayPort Ports', 'number', 'Cable', '[]', 'ports', '1', 7),
    ('usb_hub', 'USB Hub', 'number', 'Usb', '[]', 'ports', '4', 8),
    ('weight', 'Weight', 'number', 'Ruler', '[]', 'kg', '5.5', 9),
    ('thickness', 'Thickness', 'number', 'Ruler', '[]', 'mm', '50', 10),
    ('stand_height', 'Stand Height', 'number', 'Ruler', '[]', 'mm', '100-150', 11),
    ('power_consumption', 'Power Consumption', 'number', 'Power', '[]', 'W', '25', 12),
    
    -- Select specifications
    ('screen_size', 'Screen Size', 'select', 'Monitor', '["21\"", "24\"", "27\"", "32\"", "34\"", "43\"", "49\""]', 'inch', NULL, 13),
    ('resolution', 'Resolution', 'select', 'Monitor', '["FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)", "5K (5120x2880)", "8K (7680x4320)"]', NULL, NULL, 14),
    ('aspect_ratio', 'Aspect Ratio', 'select', 'Monitor', '["16:9", "16:10", "21:9", "32:9", "4:3"]', NULL, NULL, 15),
    ('refresh_rate', 'Refresh Rate', 'select', 'RotateCcw', '["60Hz", "75Hz", "120Hz", "144Hz", "165Hz", "240Hz"]', 'Hz', NULL, 16),
    ('panel_type', 'Panel Type', 'select', 'Monitor', '["IPS", "VA", "TN", "OLED", "Mini LED"]', NULL, NULL, 17),
    ('color_gamut', 'Color Gamut', 'select', 'Palette', '["sRGB", "Adobe RGB", "DCI-P3", "Rec. 2020"]', NULL, NULL, 18),
    ('hdr_support', 'HDR Support', 'select', 'Monitor', '["HDR10", "HDR10+", "Dolby Vision", "None"]', NULL, NULL, 19),
    ('energy_rating', 'Energy Rating', 'select', 'Power', '["A+++", "A++", "A+", "A", "B", "C"]', NULL, NULL, 20),
    
    -- Boolean specifications
    ('g_sync', 'G-Sync', 'boolean', 'Settings', '[]', NULL, NULL, 21),
    ('freesync', 'FreeSync', 'boolean', 'Settings', '[]', NULL, NULL, 22),
    ('curved', 'Curved Display', 'boolean', 'Monitor', '[]', NULL, NULL, 23),
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 24),
    ('built_in_speakers', 'Built-in Speakers', 'boolean', 'Speaker', '[]', NULL, NULL, 25),
    ('webcam', 'Built-in Webcam', 'boolean', 'Camera', '[]', NULL, NULL, 26),
    ('microphone', 'Built-in Microphone', 'boolean', 'Mic', '[]', NULL, NULL, 27),
    ('usb_c_port', 'USB-C Port', 'boolean', 'Usb', '[]', NULL, NULL, 28),
    ('audio_out', 'Audio Out', 'boolean', 'Headphones', '[]', NULL, NULL, 29),
    ('ethernet', 'Ethernet Port', 'boolean', 'Cable', '[]', NULL, NULL, 30),
    ('tilt', 'Tilt Adjustment', 'boolean', 'RotateCcw', '[]', NULL, NULL, 31),
    ('swivel', 'Swivel Adjustment', 'boolean', 'RotateCcw', '[]', NULL, NULL, 32),
    ('height_adjustable', 'Height Adjustable', 'boolean', 'Ruler', '[]', NULL, NULL, 33),
    ('pivot', 'Pivot (Portrait)', 'boolean', 'RotateCcw', '[]', NULL, NULL, 34),
    ('wall_mountable', 'Wall Mountable', 'boolean', 'Shield', '[]', NULL, NULL, 35)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'monitor';

-- Insert ALL default specifications for tablet category
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
    ('processor', 'Processor', 'text', 'Cpu', '[]', NULL, 'Apple A14, Snapdragon 870', 1),
    ('rear_camera', 'Rear Camera', 'text', 'Camera', '[]', NULL, '12MP', 2),
    ('front_camera', 'Front Camera', 'text', 'Camera', '[]', NULL, '7MP', 3),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Space Gray, Silver', 4),
    
    -- Number specifications
    ('screen_size', 'Screen Size', 'number', 'Monitor', '[]', 'inch', '10.9', 5),
    ('weight', 'Weight', 'number', 'Ruler', '[]', 'g', '500', 6),
    ('thickness', 'Thickness', 'number', 'Ruler', '[]', 'mm', '6.1', 7),
    ('battery_life', 'Battery Life', 'number', 'Battery', '[]', 'hours', '10', 8),
    
    -- Select specifications
    ('resolution', 'Resolution', 'select', 'Monitor', '["HD", "FHD", "QHD", "4K"]', NULL, NULL, 9),
    ('display_type', 'Display Type', 'select', 'Monitor', '["LCD", "OLED", "AMOLED"]', NULL, NULL, 10),
    ('ram', 'RAM', 'select', 'Zap', '["4GB", "6GB", "8GB", "12GB"]', NULL, NULL, 11),
    ('storage', 'Storage', 'select', 'HardDrive', '["64GB", "128GB", "256GB", "512GB", "1TB"]', NULL, NULL, 12),
    ('wifi', 'Wi-Fi', 'select', 'Wifi', '["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]', NULL, NULL, 13),
    ('bluetooth', 'Bluetooth', 'select', 'Bluetooth', '["4.0", "5.0", "5.1", "5.2"]', NULL, NULL, 14),
    
    -- Boolean specifications
    ('touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]', NULL, NULL, 15),
    ('stylus_support', 'Stylus Support', 'boolean', 'PenTool', '[]', NULL, NULL, 16),
    ('expandable_storage', 'Expandable Storage', 'boolean', 'Expand', '[]', NULL, NULL, 17),
    ('fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]', NULL, NULL, 18),
    ('face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]', NULL, NULL, 19),
    ('keyboard_support', 'Keyboard Support', 'boolean', 'Unplug', '[]', NULL, NULL, 20),
    ('cellular', 'Cellular Support', 'boolean', 'PhoneCall', '[]', NULL, NULL, 21),
    ('gps', 'GPS', 'boolean', 'Navigation', '[]', NULL, NULL, 22),
    ('usb_c_port', 'USB-C Port', 'boolean', 'Usb', '[]', NULL, NULL, 23),
    ('headphone_jack', 'Headphone Jack', 'boolean', 'Headphones', '[]', NULL, NULL, 24),
    ('fast_charging', 'Fast Charging', 'boolean', 'FastForward', '[]', NULL, NULL, 25),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 26)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'tablet';

-- Insert ALL default specifications for accessories category
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
    ('type', 'Type', 'text', 'Cable', '[]', NULL, 'Charger, Cable, Case', 1),
    ('compatibility', 'Compatibility', 'text', 'Settings', '[]', NULL, 'iPhone, Samsung, Universal', 2),
    ('color', 'Color', 'text', 'Palette', '[]', NULL, 'Black, White, Blue', 3),
    ('material', 'Material', 'text', 'Shield', '[]', NULL, 'Plastic, Metal, Leather', 4),
    ('power_output', 'Power Output', 'text', 'Power', '[]', NULL, '20W, 65W', 5),
    ('dimensions', 'Dimensions', 'text', 'Ruler', '[]', NULL, 'L x W x H', 6),
    
    -- Number specifications
    ('cable_length', 'Cable Length', 'number', 'Ruler', '[]', 'm', '1', 7),
    ('battery_life', 'Battery Life', 'number', 'Battery', '[]', 'hours', '20', 8),
    ('weight', 'Weight', 'number', 'Ruler', '[]', 'g', '50', 9),
    
    -- Select specifications
    ('connector_type', 'Connector Type', 'select', 'Usb', '["USB-A", "USB-C", "Lightning", "Micro USB"]', NULL, NULL, 10),
    ('protection_level', 'Protection Level', 'select', 'Shield', '["Basic", "Drop Protection", "Waterproof", "Military Grade"]', NULL, NULL, 11),
    ('audio_type', 'Audio Type', 'select', 'Headphones', '["Wired", "Wireless", "Bluetooth", "USB-C"]', NULL, NULL, 12),
    
    -- Boolean specifications
    ('fast_charging', 'Fast Charging', 'boolean', 'FastForward', '[]', NULL, NULL, 13),
    ('wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]', NULL, NULL, 14),
    ('transparency', 'Transparent', 'boolean', 'Eye', '[]', NULL, NULL, 15),
    ('magnetic', 'Magnetic', 'boolean', 'Settings', '[]', NULL, NULL, 16),
    ('kickstand', 'Kickstand', 'boolean', 'Settings', '[]', NULL, NULL, 17),
    ('noise_cancellation', 'Noise Cancellation', 'boolean', 'Mic', '[]', NULL, NULL, 18),
    ('microphone', 'Microphone', 'boolean', 'Mic', '[]', NULL, NULL, 19)
) AS spec_data(spec_key, name, type, icon, options, unit, placeholder, sort_order)
WHERE sc.category_id = 'accessories';

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
