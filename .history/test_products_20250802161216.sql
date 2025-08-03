-- Test Products Script
-- This script tests if products are working correctly

-- Check if products table exists and has data
SELECT 
    'Products Table Status' as test,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products;

-- Check if product variants exist
SELECT 
    'Product Variants Status' as test,
    COUNT(*) as total_variants,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_variants
FROM product_variants;

-- Show sample products with their variants
SELECT 
    p.name as product_name,
    p.brand,
    p.product_code,
    pv.sku as variant_sku,
    pv.selling_price,
    pv.quantity_in_stock,
    c.name as category_name,
    s.name as supplier_name
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN inventory_categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
ORDER BY p.name;

-- Test search functionality
SELECT 
    'Search Test Results' as test,
    COUNT(*) as search_results
FROM products p
WHERE p.name ILIKE '%iPhone%' OR p.brand ILIKE '%Apple%';

-- Success message
SELECT 'Product test completed successfully!' as status; 