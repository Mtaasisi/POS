-- Simple Product Analysis and Specification Enhancement Script
-- This script analyzes current product data and provides insights for enhancement

-- 1. Basic product count and specification analysis
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
        ELSE array_length(jsonb_object_keys(p.attributes), 1)
    END ASC,
    p.name;

-- 3. Analyze existing specifications
SELECT 
    'Specification Analysis' as analysis_type,
    COUNT(*) as total_products_with_specs,
    AVG(array_length(jsonb_object_keys(attributes), 1)) as avg_spec_count,
    MAX(array_length(jsonb_object_keys(attributes), 1)) as max_spec_count,
    MIN(array_length(jsonb_object_keys(attributes), 1)) as min_spec_count
FROM lats_products 
WHERE is_active = true 
    AND attributes IS NOT NULL 
    AND attributes != '{}';

-- 4. Show products with their variant specifications
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

-- 5. Create a simple function to enhance product specifications
CREATE OR REPLACE FUNCTION enhance_product_specs_simple(product_id UUID)
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
    
    -- Initialize enhanced specifications
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
            'connectivity', '5G',
            'camera', 'Multiple cameras',
            'battery', 'All-day battery',
            'water_resistance', 'IP68'
        );
    ELSIF LOWER(product_record.name) LIKE '%macbook%' OR LOWER(product_record.name) LIKE '%laptop%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Laptop',
            'screen_size', '13.3 inches',
            'processor', 'High-performance processor',
            'ram', '8GB+',
            'storage', 'SSD storage',
            'battery_life', '10+ hours'
        );
    ELSIF LOWER(product_record.name) LIKE '%airpods%' OR LOWER(product_record.name) LIKE '%headphone%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Audio',
            'connectivity', 'Bluetooth',
            'battery_life', 'Long battery life',
            'noise_cancellation', 'Active noise cancellation',
            'water_resistance', 'IPX4'
        );
    ELSIF LOWER(product_record.name) LIKE '%ipad%' OR LOWER(product_record.name) LIKE '%tablet%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'device_type', 'Tablet',
            'screen_size', '10.9 inches',
            'processor', 'High-performance processor',
            'battery_life', '10+ hours',
            'stylus_support', 'Yes'
        );
    ELSIF LOWER(product_record.name) LIKE '%nike%' OR LOWER(product_record.name) LIKE '%adidas%' OR LOWER(product_record.name) LIKE '%shoe%' THEN
        enhanced_specs := enhanced_specs || jsonb_build_object(
            'product_type', 'Footwear',
            'material', 'High-quality materials',
            'closure_type', 'Lace-up',
            'water_resistance', 'Waterproof',
            'breathability', 'High'
        );
    END IF;
    
    RETURN enhanced_specs;
END;
$$ LANGUAGE plpgsql;

-- 6. Test the enhancement function on a few products
SELECT 
    p.id,
    p.name,
    enhance_product_specs_simple(p.id) as enhanced_specs
FROM lats_products p
WHERE p.is_active = true
LIMIT 5;

-- 7. Create a procedure to update all products with enhanced specifications
CREATE OR REPLACE PROCEDURE update_all_product_specs()
LANGUAGE plpgsql AS $$
DECLARE
    product_record RECORD;
    enhanced_specs JSONB;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all active products
    FOR product_record IN 
        SELECT p.id, p.name
        FROM lats_products p
        WHERE p.is_active = true
    LOOP
        -- Get enhanced specifications
        enhanced_specs := enhance_product_specs_simple(product_record.id);
        
        -- Skip if there was an error
        IF enhanced_specs ? 'error' THEN
            RAISE NOTICE 'Skipping product %: %', product_record.name, enhanced_specs->>'error';
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
    END LOOP;
    
    RAISE NOTICE 'Successfully updated % products with enhanced specifications', updated_count;
END;
$$;

-- 8. Run the specification enhancement procedure
CALL update_all_product_specs();

-- 9. Verify the results
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

-- 10. Show sample enhanced products
SELECT 
    p.name,
    p.attributes
FROM lats_products p
WHERE p.is_active = true 
    AND p.attributes IS NOT NULL 
    AND p.attributes != '{}'
ORDER BY jsonb_array_length(jsonb_object_keys(p.attributes)) DESC
LIMIT 5;
