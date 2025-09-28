-- Migration: Insert Specification Data with Conflict Resolution
-- Migration: 20250131000037_insert_specification_data.sql
-- This migration inserts all the sample specification data with proper conflict handling

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
    ('processor', 'Processor', 'text', 'Cpu', $$[]$$::jsonb, NULL, 'Intel i5, AMD Ryzen 5', 1),
    ('graphics', 'Graphics', 'text', 'Monitor', $$[]$$::jsonb, NULL, 'Intel UHD, NVIDIA GTX', 2),
    ('color', 'Color', 'text', 'Palette', $$[]$$::jsonb, NULL, 'Silver, Black, Gold', 3),
    
    -- Number specifications
    ('high_refresh_rate', 'High Refresh Rate', 'number', 'RotateCcw', $$[]$$::jsonb, 'Hz', '60', 4),
    ('usb_c_ports', 'USB-C Ports', 'number', 'Usb', $$[]$$::jsonb, 'ports', '2', 5),
    ('usb_a_ports', 'USB-A Ports', 'number', 'Usb', $$[]$$::jsonb, 'ports', '2', 6),
    ('battery_life', 'Battery Life', 'number', 'Battery', $$[]$$::jsonb, 'hours', '8', 7),
    ('weight', 'Weight', 'number', 'Ruler', $$[]$$::jsonb, 'kg', '1.5', 8),
    ('thickness', 'Thickness', 'number', 'Ruler', $$[]$$::jsonb, 'mm', '15', 9),
    
    -- Select specifications
    ('screen_size', 'Screen Size', 'select', 'Monitor', $$["11 inch", "12 inch", "13 inch", "14 inch", "15 inch", "16 inch", "17 inch", "18 inch"]$$::jsonb, 'inch', NULL, 10),
    ('resolution', 'Resolution', 'select', 'Monitor', $$["HD (1366x768)", "FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)"]$$::jsonb, NULL, NULL, 11),
    ('ram', 'RAM', 'select', 'Zap', $$["4GB", "8GB", "16GB", "32GB", "64GB"]$$::jsonb, NULL, NULL, 12),
    ('storage', 'Storage', 'select', 'HardDrive', $$["128GB", "256GB", "512GB", "1TB", "2TB"]$$::jsonb, NULL, NULL, 13),
    ('storage_type', 'Storage Type', 'select', 'HardDrive', $$["HDD", "SSD", "NVMe SSD"]$$::jsonb, NULL, NULL, 14),
    ('wifi', 'Wi-Fi', 'select', 'Wifi', $$["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]$$::jsonb, NULL, NULL, 15),
    ('bluetooth', 'Bluetooth', 'select', 'Bluetooth', $$["4.0", "5.0", "5.1", "5.2"]$$::jsonb, NULL, NULL, 16),
    
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
WHERE sc.category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    icon = EXCLUDED.icon,
    options = EXCLUDED.options,
    unit = EXCLUDED.unit,
    placeholder = EXCLUDED.placeholder,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
