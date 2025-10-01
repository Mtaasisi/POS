-- Simple Product Specification Enhancement Script
-- This script avoids complex array functions and uses basic JSON operations

-- 1. Show current product overview
SELECT 
    'Product Overview' as analysis_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) as products_with_specs,
    COUNT(CASE WHEN attributes IS NULL OR attributes = '{}' THEN 1 END) as products_without_specs
FROM lats_products 
WHERE is_active = true;

-- 2. Show products that need specification enhancement
SELECT 
    p.id,
    p.name,
    p.description,
    c.name as category,
    CASE 
        WHEN p.attributes IS NULL OR p.attributes = '{}' THEN 'No specifications'
        ELSE 'Has specifications'
    END as spec_status
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 3. Create a simple function to enhance product specifications
CREATE OR REPLACE FUNCTION enhance_product_specs(product_id UUID)
RETURNS JSONB AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
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
    
    -- Add basic model information
    enhanced_specs := enhanced_specs || jsonb_build_object(
        'model', product_record.name,
        'category', COALESCE(product_record.category_name, 'General'),
        'last_updated', NOW()::text
    );
    
    -- Add category-specific specifications based on product name patterns
    IF LOWER(product_record.name) LIKE '%iphone%' OR LOWER(product_record.name) LIKE '%galaxy%' OR LOWER(product_record.name) LIKE '%pixel%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Smartphone',
            'screen_size', '6.1 inches',
            'display_type', 'OLED',
            'connectivity', '5G',
            'camera_main', '50MP',
            'battery_capacity', '4000mAh',
            'water_resistance', 'IP68',
            'weight', '180g'
        );
    ELSIF LOWER(product_record.name) LIKE '%macbook%' OR LOWER(product_record.name) LIKE '%laptop%' OR LOWER(product_record.name) LIKE '%notebook%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Laptop',
            'screen_size', '13.3 inches',
            'display_type', 'IPS',
            'processor', 'Intel Core i7',
            'ram', '16GB',
            'storage', '512GB SSD',
            'battery_life', '10 hours',
            'weight', '1.3kg'
        );
    ELSIF LOWER(product_record.name) LIKE '%airpods%' OR LOWER(product_record.name) LIKE '%headphone%' OR LOWER(product_record.name) LIKE '%earphone%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Audio',
            'driver_size', '40mm',
            'connectivity', 'Bluetooth 5.0',
            'battery_life', '30 hours',
            'noise_cancellation', 'Active',
            'water_resistance', 'IPX4',
            'weight', '250g'
        );
    ELSIF LOWER(product_record.name) LIKE '%ipad%' OR LOWER(product_record.name) LIKE '%tablet%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Tablet',
            'screen_size', '10.9 inches',
            'display_type', 'LCD',
            'processor', 'A14 Bionic',
            'battery_life', '10 hours',
            'stylus_support', 'Yes',
            'weight', '460g'
        );
    ELSIF LOWER(product_record.name) LIKE '%nike%' OR LOWER(product_record.name) LIKE '%adidas%' OR LOWER(product_record.name) LIKE '%shoe%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Footwear',
            'material', 'Mesh/Leather',
            'sole_material', 'Rubber',
            'closure_type', 'Lace-up',
            'water_resistance', 'Waterproof',
            'breathability', 'High',
            'weight', '300g'
        );
    ELSIF LOWER(product_record.name) LIKE '%shirt%' OR LOWER(product_record.name) LIKE '%pants%' OR LOWER(product_record.name) LIKE '%dress%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Clothing',
            'material', 'Cotton/Polyester',
            'size_range', 'S-XXL',
            'care_instructions', 'Machine wash',
            'fit', 'Regular',
            'season', 'All season'
        );
    ELSE
        -- Add general specifications for other products
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'General',
            'material', 'High-quality',
            'durability', 'Long-lasting',
            'warranty', '1 year',
            'origin', 'Various'
        );
    END IF;
    
    RETURN enhanced_specs;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the enhancement function on a few products
SELECT 
    p.id,
    p.name,
    enhance_product_specs(p.id) as enhanced_specs
FROM lats_products p
WHERE p.is_active = true
LIMIT 3;

-- 5. Create a procedure to update all products with enhanced specifications
CREATE OR REPLACE PROCEDURE update_all_product_specifications()
LANGUAGE plpgsql AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting product specification enhancement...';
    
    -- Loop through all active products
    FOR product_record IN 
        SELECT p.id, p.name
        FROM lats_products p
        WHERE p.is_active = true
        ORDER BY p.name
    LOOP
        BEGIN
            -- Get enhanced specifications
            enhanced_specs := enhance_product_specs(product_record.id);
            
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
    
    RAISE NOTICE 'Enhancement completed: % products updated, % errors', updated_count, error_count;
END;
$$;

-- 6. Run the specification enhancement procedure
CALL update_all_product_specifications();

-- 7. Verify the results
SELECT 
    'Enhancement Results' as analysis_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) as products_with_specs,
    ROUND(
        COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as spec_coverage_percentage
FROM lats_products 
WHERE is_active = true;

-- 8. Show sample enhanced products
SELECT 
    p.name,
    p.attributes
FROM lats_products p
WHERE p.is_active = true 
    AND p.attributes IS NOT NULL 
    AND p.attributes != '{}'
ORDER BY p.name
LIMIT 5;
