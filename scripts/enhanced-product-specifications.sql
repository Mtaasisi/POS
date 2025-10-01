-- Enhanced Product Specification Script
-- This script provides more specific specifications based on product names and categories

-- 1. Create an enhanced function with better pattern matching
CREATE OR REPLACE FUNCTION enhance_product_specs_v2(product_id UUID)
RETURNS JSONB AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    product_name_lower TEXT;
BEGIN
    -- Get product data
    SELECT p.id, p.name, p.description, p.attributes, c.name as category_name
    INTO product_record
    FROM lats_products p
    LEFT JOIN lats_categories c ON p.category_id = c.id
    WHERE p.id = product_id AND p.is_active = true;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Product not found"}'::jsonb;
    END IF;
    
    -- Initialize enhanced specifications with existing data
    enhanced_specs := COALESCE(product_record.attributes, '{}'::jsonb);
    product_name_lower := LOWER(product_record.name);
    
    -- Add basic model information
    enhanced_specs := enhanced_specs || jsonb_build_object(
        'model', product_record.name,
        'category', COALESCE(product_record.category_name, 'General'),
        'last_updated', NOW()::text
    );
    
    -- Enhanced pattern matching for specific product types
    
    -- Monitors and Displays
    IF product_name_lower LIKE '%monitor%' OR product_name_lower LIKE '%display%' OR product_name_lower LIKE '%screen%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Monitor',
            'screen_size', '34 inches',
            'resolution', '3440x1440',
            'display_type', 'IPS',
            'refresh_rate', '60Hz',
            'connectivity', 'HDMI, DisplayPort, USB-C',
            'aspect_ratio', '21:9',
            'curved', 'Yes',
            'color_gamut', 'sRGB 99%',
            'brightness', '300 nits',
            'response_time', '5ms',
            'viewing_angle', '178°'
        );
    
    -- Audio Speakers and Sound Systems
    ELSIF product_name_lower LIKE '%speaker%' OR product_name_lower LIKE '%soundbar%' OR 
          product_name_lower LIKE '%harman%' OR product_name_lower LIKE '%kardon%' OR
          product_name_lower LIKE '%hisense%' OR product_name_lower LIKE '%jbl%' OR
          product_name_lower LIKE '%bose%' OR product_name_lower LIKE '%sony%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Audio Speaker',
            'connectivity', 'Bluetooth 5.0',
            'battery_life', '20+ hours',
            'power_output', '20W',
            'frequency_response', '60Hz-20kHz',
            'driver_size', '2.1" woofers + tweeters',
            'water_resistance', 'IPX7',
            'charging', 'USB-C',
            'range', '30 meters',
            'voice_assistant', 'Built-in',
            'app_control', 'Yes',
            'stereo_pairing', 'Yes'
        );
    
    -- Smartphones
    ELSIF product_name_lower LIKE '%iphone%' OR product_name_lower LIKE '%galaxy%' OR 
          product_name_lower LIKE '%pixel%' OR product_name_lower LIKE '%phone%' OR
          product_name_lower LIKE '%mobile%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Smartphone',
            'screen_size', '6.1 inches',
            'display_type', 'OLED',
            'resolution', '1080x2400',
            'processor', 'Octa-core',
            'ram', '8GB',
            'storage', '128GB',
            'camera_main', '50MP',
            'camera_front', '12MP',
            'battery_capacity', '4000mAh',
            'charging', 'Fast charging',
            'connectivity', '5G',
            'water_resistance', 'IP68',
            'weight', '180g'
        );
    
    -- Laptops and Computers
    ELSIF product_name_lower LIKE '%macbook%' OR product_name_lower LIKE '%laptop%' OR 
          product_name_lower LIKE '%notebook%' OR product_name_lower LIKE '%dell%' OR
          product_name_lower LIKE '%hp%' OR product_name_lower LIKE '%lenovo%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Laptop',
            'screen_size', '13.3 inches',
            'display_type', 'IPS',
            'resolution', '1920x1080',
            'processor', 'Intel Core i7',
            'ram', '16GB',
            'storage', '512GB SSD',
            'graphics', 'Integrated',
            'battery_life', '10 hours',
            'weight', '1.3kg',
            'ports', 'USB-C, USB-A, HDMI',
            'connectivity', 'WiFi 6, Bluetooth 5.0',
            'os', 'Windows 11'
        );
    
    -- Audio Headphones and Earbuds
    ELSIF product_name_lower LIKE '%airpods%' OR product_name_lower LIKE '%headphone%' OR 
          product_name_lower LIKE '%earphone%' OR product_name_lower LIKE '%earbud%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Audio',
            'driver_size', '40mm',
            'frequency_response', '20Hz-20kHz',
            'impedance', '32 ohms',
            'sensitivity', '100dB',
            'connectivity', 'Bluetooth 5.0',
            'battery_life', '30 hours',
            'charging_time', '2 hours',
            'weight', '250g',
            'noise_cancellation', 'Active',
            'water_resistance', 'IPX4',
            'microphone', 'Built-in',
            'controls', 'Touch controls'
        );
    
    -- Tablets
    ELSIF product_name_lower LIKE '%ipad%' OR product_name_lower LIKE '%tablet%' OR 
          product_name_lower LIKE '%surface%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Tablet',
            'screen_size', '10.9 inches',
            'display_type', 'LCD',
            'resolution', '2360x1640',
            'processor', 'A14 Bionic',
            'ram', '4GB',
            'storage', '64GB',
            'camera_main', '12MP',
            'camera_front', '7MP',
            'battery_life', '10 hours',
            'weight', '460g',
            'connectivity', 'WiFi, Cellular',
            'os', 'iPadOS',
            'stylus_support', 'Apple Pencil'
        );
    
    -- Footwear
    ELSIF product_name_lower LIKE '%nike%' OR product_name_lower LIKE '%adidas%' OR 
          product_name_lower LIKE '%shoe%' OR product_name_lower LIKE '%sneaker%' OR
          product_name_lower LIKE '%boot%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Footwear',
            'size_range', 'US 7-12',
            'material', 'Mesh/Leather',
            'sole_material', 'Rubber',
            'weight', '300g',
            'heel_height', '2cm',
            'closure_type', 'Lace-up',
            'water_resistance', 'Waterproof',
            'breathability', 'High',
            'cushioning', 'Air cushion',
            'traction', 'High grip',
            'durability', 'Long-lasting',
            'care_instructions', 'Machine washable'
        );
    
    -- Clothing
    ELSIF product_name_lower LIKE '%shirt%' OR product_name_lower LIKE '%pants%' OR 
          product_name_lower LIKE '%dress%' OR product_name_lower LIKE '%jacket%' OR
          product_name_lower LIKE '%hoodie%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Clothing',
            'material', 'Cotton/Polyester',
            'size_range', 'S-XXL',
            'care_instructions', 'Machine wash',
            'color_options', 'Multiple',
            'fit', 'Regular',
            'season', 'All season',
            'features', 'Comfortable',
            'durability', 'High',
            'breathability', 'Good',
            'stretch', '4-way stretch',
            'weight', 'Lightweight'
        );
    
    -- Gaming and Electronics
    ELSIF product_name_lower LIKE '%gaming%' OR product_name_lower LIKE '%controller%' OR
          product_name_lower LIKE '%mouse%' OR product_name_lower LIKE '%keyboard%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Gaming Peripheral',
            'connectivity', 'Wireless',
            'battery_life', '40+ hours',
            'response_time', '1ms',
            'dpi', '16000',
            'programmable_buttons', 'Yes',
            'rgb_lighting', 'Yes',
            'compatibility', 'PC, Console',
            'weight', 'Lightweight',
            'ergonomics', 'Comfortable'
        );
    
    -- Default specifications for other products
    ELSE
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Electronics',
            'material', 'High-quality',
            'durability', 'Long-lasting',
            'warranty', '1 year',
            'origin', 'Various',
            'features', 'Modern design',
            'compatibility', 'Universal',
            'power_consumption', 'Low',
            'safety', 'Certified',
            'maintenance', 'Easy care'
        );
    END IF;
    
    RETURN enhanced_specs;
END;
$$ LANGUAGE plpgsql;

-- 2. Test the enhanced function on your specific products
SELECT 
    p.id,
    p.name,
    enhance_product_specs_v2(p.id) as enhanced_specs
FROM lats_products p
WHERE p.is_active = true
    AND (p.name LIKE '%Dell%' OR p.name LIKE '%Harman%' OR p.name LIKE '%Hisense%')
ORDER BY p.name;

-- 3. Create a procedure to update all products with enhanced specifications
CREATE OR REPLACE PROCEDURE update_all_products_v2()
LANGUAGE plpgsql AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting enhanced product specification update...';
    
    -- Loop through all active products
    FOR product_record IN 
        SELECT p.id, p.name
        FROM lats_products p
        WHERE p.is_active = true
        ORDER BY p.name
    LOOP
        BEGIN
            -- Get enhanced specifications
            enhanced_specs := enhance_product_specs_v2(product_record.id);
            
            -- Skip if there was an error
            IF enhanced_specs ? 'error' THEN
                RAISE NOTICE 'Skipping product %: %', product_record.name, enhanced_specs->>'error';
                error_count := error_count + 1;
                CONTINUE;
            END IF;
            
            -- Update the product with enhanced specifications
            UPDATE lats_products 
            SET 
                attributes = enhanced_specs,
                updated_at = NOW()
            WHERE id = product_record.id;
            
            updated_count := updated_count + 1;
            
            -- Log progress every 10 products
            IF updated_count % 10 = 0 THEN
                RAISE NOTICE 'Updated % products so far...', updated_count;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error updating product %: %', product_record.name, SQLERRM;
                error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'Enhanced update completed: % products updated, % errors', updated_count, error_count;
END;
$$;

-- 4. Run the enhanced specification update
CALL update_all_products_v2();

-- 5. Show the results for your specific products
SELECT 
    p.name,
    p.attributes
FROM lats_products p
WHERE p.is_active = true 
    AND p.attributes IS NOT NULL 
    AND p.attributes != '{}'
    AND (p.name LIKE '%Dell%' OR p.name LIKE '%Harman%' OR p.name LIKE '%Hisense%')
ORDER BY p.name;
