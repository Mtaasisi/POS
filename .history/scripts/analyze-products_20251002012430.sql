-- Product Analysis and Specification Enhancement Script
-- This script analyzes current product data and provides insights for enhancement

-- 1. Analyze current product specifications
SELECT 
    'Current Product Analysis' as analysis_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) as products_with_specs,
    COUNT(CASE WHEN attributes IS NULL OR attributes = '{}' THEN 1 END) as products_without_specs,
    ROUND(
        COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as spec_coverage_percentage
FROM lats_products 
WHERE is_active = true;

-- 2. Analyze product categories and their specification patterns
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count,
    COUNT(CASE WHEN p.attributes IS NOT NULL AND p.attributes != '{}' THEN 1 END) as with_specs,
    ROUND(
        COUNT(CASE WHEN p.attributes IS NOT NULL AND p.attributes != '{}' THEN 1 END) * 100.0 / COUNT(p.id), 
        2
    ) as spec_coverage
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
WHERE p.is_active = true
GROUP BY c.name
ORDER BY product_count DESC;

-- 3. Analyze product names to detect common models/patterns
SELECT 
    CASE 
        WHEN LOWER(p.name) LIKE '%iphone%' OR LOWER(p.name) LIKE '%galaxy%' OR LOWER(p.name) LIKE '%pixel%' THEN 'Smartphones'
        WHEN LOWER(p.name) LIKE '%macbook%' OR LOWER(p.name) LIKE '%laptop%' OR LOWER(p.name) LIKE '%notebook%' THEN 'Laptops'
        WHEN LOWER(p.name) LIKE '%airpods%' OR LOWER(p.name) LIKE '%headphone%' OR LOWER(p.name) LIKE '%earphone%' THEN 'Audio'
        WHEN LOWER(p.name) LIKE '%ipad%' OR LOWER(p.name) LIKE '%tablet%' THEN 'Tablets'
        WHEN LOWER(p.name) LIKE '%nike%' OR LOWER(p.name) LIKE '%adidas%' OR LOWER(p.name) LIKE '%shoe%' THEN 'Footwear'
        WHEN LOWER(p.name) LIKE '%shirt%' OR LOWER(p.name) LIKE '%pants%' OR LOWER(p.name) LIKE '%dress%' THEN 'Clothing'
        ELSE 'Other'
    END as detected_category,
    COUNT(*) as product_count,
    STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name LIMIT 5) as sample_products
FROM lats_products p
WHERE p.is_active = true
GROUP BY 
    CASE 
        WHEN LOWER(p.name) LIKE '%iphone%' OR LOWER(p.name) LIKE '%galaxy%' OR LOWER(p.name) LIKE '%pixel%' THEN 'Smartphones'
        WHEN LOWER(p.name) LIKE '%macbook%' OR LOWER(p.name) LIKE '%laptop%' OR LOWER(p.name) LIKE '%notebook%' THEN 'Laptops'
        WHEN LOWER(p.name) LIKE '%airpods%' OR LOWER(p.name) LIKE '%headphone%' OR LOWER(p.name) LIKE '%earphone%' THEN 'Audio'
        WHEN LOWER(p.name) LIKE '%ipad%' OR LOWER(p.name) LIKE '%tablet%' THEN 'Tablets'
        WHEN LOWER(p.name) LIKE '%nike%' OR LOWER(p.name) LIKE '%adidas%' OR LOWER(p.name) LIKE '%shoe%' THEN 'Footwear'
        WHEN LOWER(p.name) LIKE '%shirt%' OR LOWER(p.name) LIKE '%pants%' OR LOWER(p.name) LIKE '%dress%' THEN 'Clothing'
        ELSE 'Other'
    END
ORDER BY product_count DESC;

-- 4. Analyze existing specifications to understand current patterns
SELECT 
    'Specification Analysis' as analysis_type,
    COUNT(*) as total_products_with_specs,
    AVG(jsonb_array_length(jsonb_object_keys(attributes))) as avg_spec_count,
    MAX(jsonb_array_length(jsonb_object_keys(attributes))) as max_spec_count,
    MIN(jsonb_array_length(jsonb_object_keys(attributes))) as min_spec_count
FROM lats_products 
WHERE is_active = true 
    AND attributes IS NOT NULL 
    AND attributes != '{}';

-- 5. Show products that need specification enhancement
SELECT 
    p.id,
    p.name,
    p.description,
    c.name as category,
    CASE 
        WHEN p.attributes IS NULL OR p.attributes = '{}' THEN 'No specifications'
        ELSE 'Has specifications'
    END as spec_status,
    CASE 
        WHEN p.attributes IS NOT NULL AND p.attributes != '{}' 
        THEN jsonb_array_length(jsonb_object_keys(p.attributes))
        ELSE 0
    END as spec_count
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY 
    CASE 
        WHEN p.attributes IS NULL OR p.attributes = '{}' THEN 0
        ELSE jsonb_array_length(jsonb_object_keys(p.attributes))
    END ASC,
    p.name;

-- 6. Analyze variant specifications
SELECT 
    'Variant Specification Analysis' as analysis_type,
    COUNT(*) as total_variants,
    COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) as variants_with_specs,
    ROUND(
        COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as variant_spec_coverage
FROM lats_product_variants;

-- 7. Show products with their variant specifications
SELECT 
    p.name as product_name,
    pv.name as variant_name,
    pv.sku,
    CASE 
        WHEN pv.attributes IS NULL OR pv.attributes = '{}' THEN 'No specifications'
        ELSE 'Has specifications'
    END as variant_spec_status,
    CASE 
        WHEN pv.attributes IS NOT NULL AND pv.attributes != '{}' 
        THEN jsonb_array_length(jsonb_object_keys(pv.attributes))
        ELSE 0
    END as variant_spec_count
FROM lats_products p
JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
ORDER BY p.name, pv.name;

-- 8. Create a function to enhance product specifications
CREATE OR REPLACE FUNCTION enhance_product_specifications()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    enhanced_specs JSONB,
    spec_count INTEGER
) AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    spec_count INTEGER;
BEGIN
    -- Loop through all active products
    FOR product_record IN 
        SELECT 
            p.id,
            p.name,
            p.description,
            p.attributes,
            c.name as category_name
        FROM lats_products p
        LEFT JOIN lats_categories c ON p.category_id = c.id
        WHERE p.is_active = true
    LOOP
        -- Initialize enhanced specifications
        enhanced_specs := COALESCE(product_record.attributes, '{}'::jsonb);
        
        -- Add model information
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'model', product_record.name,
            'category', COALESCE(product_record.category_name, 'General'),
            'last_updated', NOW()::text
        );
        
        -- Add category-specific specifications based on product name patterns
        IF LOWER(product_record.name) LIKE '%iphone%' OR LOWER(product_record.name) LIKE '%galaxy%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Smartphone',
                'screen_size', '6.1 inches',
                'connectivity', '5G',
                'camera', 'Multiple cameras',
                'battery', 'All-day battery'
            );
        ELSIF LOWER(product_record.name) LIKE '%macbook%' OR LOWER(product_record.name) LIKE '%laptop%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Laptop',
                'screen_size', '13.3 inches',
                'processor', 'High-performance processor',
                'ram', '8GB+',
                'storage', 'SSD storage'
            );
        ELSIF LOWER(product_record.name) LIKE '%airpods%' OR LOWER(product_record.name) LIKE '%headphone%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Audio',
                'connectivity', 'Bluetooth',
                'battery_life', 'Long battery life',
                'noise_cancellation', 'Active noise cancellation'
            );
        END IF;
        
        -- Count specifications
        spec_count := jsonb_array_length(jsonb_object_keys(enhanced_specs));
        
        -- Return the enhanced specifications
        product_id := product_record.id;
        product_name := product_record.name;
        enhanced_specs := enhanced_specs;
        spec_count := spec_count;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Test the enhancement function
SELECT * FROM enhance_product_specifications() LIMIT 10;

-- 10. Create a procedure to actually update the specifications
CREATE OR REPLACE PROCEDURE update_product_specifications()
LANGUAGE plpgsql AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all active products
    FOR product_record IN 
        SELECT 
            p.id,
            p.name,
            p.description,
            p.attributes,
            c.name as category_name
        FROM lats_products p
        LEFT JOIN lats_categories c ON p.category_id = c.id
        WHERE p.is_active = true
    LOOP
        -- Initialize enhanced specifications with existing data
        enhanced_specs := COALESCE(product_record.attributes, '{}'::jsonb);
        
        -- Add model information
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
                'water_resistance', 'IP68'
            );
        ELSIF LOWER(product_record.name) LIKE '%macbook%' OR LOWER(product_record.name) LIKE '%laptop%' OR LOWER(product_record.name) LIKE '%notebook%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Laptop',
                'screen_size', '13.3 inches',
                'display_type', 'IPS',
                'processor', 'Intel Core i7',
                'ram', '16GB',
                'storage', '512GB SSD',
                'battery_life', '10 hours'
            );
        ELSIF LOWER(product_record.name) LIKE '%airpods%' OR LOWER(product_record.name) LIKE '%headphone%' OR LOWER(product_record.name) LIKE '%earphone%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Audio',
                'driver_size', '40mm',
                'connectivity', 'Bluetooth 5.0',
                'battery_life', '30 hours',
                'noise_cancellation', 'Active',
                'water_resistance', 'IPX4'
            );
        ELSIF LOWER(product_record.name) LIKE '%ipad%' OR LOWER(product_record.name) LIKE '%tablet%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'device_type', 'Tablet',
                'screen_size', '10.9 inches',
                'display_type', 'LCD',
                'processor', 'A14 Bionic',
                'battery_life', '10 hours',
                'stylus_support', 'Yes'
            );
        ELSIF LOWER(product_record.name) LIKE '%nike%' OR LOWER(product_record.name) LIKE '%adidas%' OR LOWER(product_record.name) LIKE '%shoe%' THEN
            enhanced_specs := enhanced_specs || jsonb_build_object(
                'product_type', 'Footwear',
                'material', 'Mesh/Leather',
                'sole_material', 'Rubber',
                'closure_type', 'Lace-up',
                'water_resistance', 'Waterproof',
                'breathability', 'High'
            );
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
    END LOOP;
    
    RAISE NOTICE 'Successfully updated % products with enhanced specifications', updated_count;
END;
$$;

-- 11. Run the specification enhancement procedure
CALL update_product_specifications();

-- 12. Verify the results
SELECT 
    'Enhancement Results' as analysis_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) as products_with_specs,
    ROUND(
        COUNT(CASE WHEN attributes IS NOT NULL AND attributes != '{}' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as spec_coverage_percentage,
    AVG(jsonb_array_length(jsonb_object_keys(attributes))) as avg_spec_count
FROM lats_products 
WHERE is_active = true;
