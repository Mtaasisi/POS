-- Add Sample Products for POS Testing
-- This script adds sample products to the products table

-- First, get the category and supplier IDs
DO $$
DECLARE
    electronics_category_id UUID;
    parts_category_id UUID;
    techparts_supplier_id UUID;
    mobileparts_supplier_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_category_id FROM inventory_categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO parts_category_id FROM inventory_categories WHERE name = 'Parts' LIMIT 1;
    
    -- Get supplier IDs
    SELECT id INTO techparts_supplier_id FROM suppliers WHERE name = 'TechParts Ltd' LIMIT 1;
    SELECT id INTO mobileparts_supplier_id FROM suppliers WHERE name = 'MobileParts Kenya' LIMIT 1;
    
    -- Insert sample products (only if they don't exist)
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'iPhone 13 Screen', 'Original replacement screen for iPhone 13', 'Apple', 'iPhone 13', electronics_category_id, techparts_supplier_id, 'IP13-SCR-001', 'IP13-SCR-001', 5, 20, 5, true, ARRAY['screen', 'iphone'], '{"color": "black", "resolution": "1170x2532"}', 12
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'IP13-SCR-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'Samsung Galaxy S21 Battery', 'Original battery replacement for Samsung Galaxy S21', 'Samsung', 'Galaxy S21', electronics_category_id, mobileparts_supplier_id, 'SGS21-BAT-001', 'SGS21-BAT-001', 8, 25, 8, true, ARRAY['battery', 'samsung'], '{"capacity": "4000mAh", "voltage": "3.85V"}', 12
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'SGS21-BAT-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'iPhone 12 Charging Port', 'Replacement charging port for iPhone 12', 'Apple', 'iPhone 12', parts_category_id, techparts_supplier_id, 'IP12-CHG-001', 'IP12-CHG-001', 10, 30, 10, true, ARRAY['charging_port', 'iphone'], '{"connector": "Lightning", "fast_charging": true}', 6
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'IP12-CHG-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'Samsung Galaxy A52 Camera', 'Replacement camera module for Samsung Galaxy A52', 'Samsung', 'Galaxy A52', parts_category_id, mobileparts_supplier_id, 'SGA52-CAM-001', 'SGA52-CAM-001', 6, 20, 6, true, ARRAY['camera', 'samsung'], '{"megapixels": "64MP", "aperture": "f/1.8"}', 12
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'SGA52-CAM-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'iPhone 14 Pro Speaker', 'Replacement speaker for iPhone 14 Pro', 'Apple', 'iPhone 14 Pro', parts_category_id, techparts_supplier_id, 'IP14P-SPK-001', 'IP14P-SPK-001', 4, 15, 4, true, ARRAY['speaker', 'iphone'], '{"impedance": "8Ω", "power": "2W"}', 12
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'IP14P-SPK-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'Samsung Galaxy S22 Microphone', 'Replacement microphone for Samsung Galaxy S22', 'Samsung', 'Galaxy S22', parts_category_id, mobileparts_supplier_id, 'SGS22-MIC-001', 'SGS22-MIC-001', 7, 18, 7, true, ARRAY['microphone', 'samsung'], '{"sensitivity": "-38dB", "impedance": "2.2kΩ"}', 6
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'SGS22-MIC-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'iPhone 13 Pro Motherboard', 'Replacement motherboard for iPhone 13 Pro', 'Apple', 'iPhone 13 Pro', parts_category_id, techparts_supplier_id, 'IP13P-MB-001', 'IP13P-MB-001', 3, 10, 3, true, ARRAY['motherboard', 'iphone'], '{"chipset": "A15 Bionic", "storage": "128GB"}', 24
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'IP13P-MB-001');
    
    INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, barcode, minimum_stock_level, maximum_stock_level, reorder_point, is_active, tags, specifications, warranty_period_months)
    SELECT 'Samsung Galaxy A53 Screen', 'Replacement screen for Samsung Galaxy A53', 'Samsung', 'Galaxy A53', electronics_category_id, mobileparts_supplier_id, 'SGA53-SCR-001', 'SGA53-SCR-001', 6, 22, 6, true, ARRAY['screen', 'samsung'], '{"color": "black", "resolution": "1080x2400"}', 12
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'SGA53-SCR-001');
    
    -- Insert variants for each product
    INSERT INTO product_variants (product_id, sku, variant_name, attributes, cost_price, selling_price, quantity_in_stock, weight_kg, dimensions_cm, is_active)
    SELECT 
        p.id,
        p.product_code || '-V1',
        p.name || ' - Standard',
        '{"color": "black", "grade": "A"}',
        CASE 
            WHEN p.name LIKE '%Screen%' THEN 15000
            WHEN p.name LIKE '%Battery%' THEN 8000
            WHEN p.name LIKE '%Camera%' THEN 12000
            WHEN p.name LIKE '%Speaker%' THEN 5000
            WHEN p.name LIKE '%Microphone%' THEN 3000
            WHEN p.name LIKE '%Motherboard%' THEN 45000
            WHEN p.name LIKE '%Charging%' THEN 6000
            ELSE 10000
        END,
        CASE 
            WHEN p.name LIKE '%Screen%' THEN 25000
            WHEN p.name LIKE '%Battery%' THEN 15000
            WHEN p.name LIKE '%Camera%' THEN 20000
            WHEN p.name LIKE '%Speaker%' THEN 8000
            WHEN p.name LIKE '%Microphone%' THEN 5000
            WHEN p.name LIKE '%Motherboard%' THEN 75000
            WHEN p.name LIKE '%Charging%' THEN 12000
            ELSE 18000
        END,
        FLOOR(RANDOM() * 15) + 5, -- Random stock between 5-20
        0.1,
        '10x5x2',
        true
    FROM products p
    WHERE p.product_code IN ('IP13-SCR-001', 'SGS21-BAT-001', 'IP12-CHG-001', 'SGA52-CAM-001', 'IP14P-SPK-001', 'SGS22-MIC-001', 'IP13P-MB-001', 'SGA53-SCR-001')
    ON CONFLICT (sku) DO NOTHING;
    
    RAISE NOTICE 'Sample products added successfully!';
END $$;

-- Success message
SELECT 'Sample products added successfully! You should now see inventory products in the POS system.' as status; 