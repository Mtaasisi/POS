-- Migration: Insert Specification Data (Simple Approach)
-- Migration: 20250131000038_insert_specification_data_simple.sql
-- This migration inserts all the sample specification data using simple INSERT statements

-- Insert laptop specifications
INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'processor', 'Processor', 'text', 'Cpu', '[]'::jsonb, NULL, 'Intel i5, AMD Ryzen 5', 1
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'graphics', 'Graphics', 'text', 'Monitor', '[]'::jsonb, NULL, 'Intel UHD, NVIDIA GTX', 2
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'color', 'Color', 'text', 'Palette', '[]'::jsonb, NULL, 'Silver, Black, Gold', 3
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'high_refresh_rate', 'High Refresh Rate', 'number', 'RotateCcw', '[]'::jsonb, 'Hz', '60', 4
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'usb_c_ports', 'USB-C Ports', 'number', 'Usb', '[]'::jsonb, 'ports', '2', 5
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'usb_a_ports', 'USB-A Ports', 'number', 'Usb', '[]'::jsonb, 'ports', '2', 6
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'battery_life', 'Battery Life', 'number', 'Battery', '[]'::jsonb, 'hours', '8', 7
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'weight', 'Weight', 'number', 'Ruler', '[]'::jsonb, 'kg', '1.5', 8
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'thickness', 'Thickness', 'number', 'Ruler', '[]'::jsonb, 'mm', '15', 9
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

-- Select specifications with proper JSON arrays
INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'screen_size', 'Screen Size', 'select', 'Monitor', 
    '["11 inch", "12 inch", "13 inch", "14 inch", "15 inch", "16 inch", "17 inch", "18 inch"]'::jsonb, 
    'inch', NULL, 10
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'resolution', 'Resolution', 'select', 'Monitor', 
    '["HD (1366x768)", "FHD (1920x1080)", "QHD (2560x1440)", "4K (3840x2160)"]'::jsonb, 
    NULL, NULL, 11
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'ram', 'RAM', 'select', 'Zap', 
    '["4GB", "8GB", "16GB", "32GB", "64GB"]'::jsonb, 
    NULL, NULL, 12
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'storage', 'Storage', 'select', 'HardDrive', 
    '["128GB", "256GB", "512GB", "1TB", "2TB"]'::jsonb, 
    NULL, NULL, 13
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'storage_type', 'Storage Type', 'select', 'HardDrive', 
    '["HDD", "SSD", "NVMe SSD"]'::jsonb, 
    NULL, NULL, 14
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'wifi', 'Wi-Fi', 'select', 'Wifi', 
    '["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"]'::jsonb, 
    NULL, NULL, 15
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'bluetooth', 'Bluetooth', 'select', 'Bluetooth', 
    '["4.0", "5.0", "5.1", "5.2"]'::jsonb, 
    NULL, NULL, 16
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

-- Boolean specifications
INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'touch_screen', 'Touch Screen', 'boolean', 'Hand', '[]'::jsonb, NULL, NULL, 17
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'oled_display', 'OLED Display', 'boolean', 'Monitor', '[]'::jsonb, NULL, NULL, 18
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'backlit_keyboard', 'Backlit Keyboard', 'boolean', 'Lightbulb', '[]'::jsonb, NULL, NULL, 19
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'fingerprint_scanner', 'Fingerprint Scanner', 'boolean', 'Fingerprint', '[]'::jsonb, NULL, NULL, 20
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'face_id', 'Face Recognition', 'boolean', 'ScanFace', '[]'::jsonb, NULL, NULL, 21
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'convertible', 'Convertible (2-in-1)', 'boolean', 'RotateCcw', '[]'::jsonb, NULL, NULL, 22
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'stylus_support', 'Stylus Support', 'boolean', 'PenTool', '[]'::jsonb, NULL, NULL, 23
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'hdmi_port', 'HDMI Port', 'boolean', 'Cable', '[]'::jsonb, NULL, NULL, 24
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'thunderbolt', 'Thunderbolt', 'boolean', 'Cable', '[]'::jsonb, NULL, NULL, 25
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'headphone_jack', 'Headphone Jack', 'boolean', 'Headphones', '[]'::jsonb, NULL, NULL, 26
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'fast_charging', 'Fast Charging', 'boolean', 'FastForward', '[]'::jsonb, NULL, NULL, 27
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'wireless_charging', 'Wireless Charging', 'boolean', 'BatteryCharging', '[]'::jsonb, NULL, NULL, 28
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'waterproof', 'Waterproof', 'boolean', 'Droplets', '[]'::jsonb, NULL, NULL, 29
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'dust_resistant', 'Dust Resistant', 'boolean', 'Wind', '[]'::jsonb, NULL, NULL, 30
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();

INSERT INTO lats_specifications (category_id, spec_key, name, type, icon, options, unit, placeholder, sort_order) 
SELECT id, 'military_grade', 'Military Grade', 'boolean', 'Shield', '[]'::jsonb, NULL, NULL, 31
FROM lats_specification_categories WHERE category_id = 'laptop'
ON CONFLICT (category_id, spec_key) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, icon = EXCLUDED.icon, 
    options = EXCLUDED.options, unit = EXCLUDED.unit, placeholder = EXCLUDED.placeholder, 
    sort_order = EXCLUDED.sort_order, updated_at = NOW();
