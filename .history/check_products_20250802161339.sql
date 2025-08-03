-- Check Products in Database
-- This script checks if products exist and shows their details

-- Check if products table has any data
SELECT 
    'Products Count' as check_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products;

-- Show all products with basic info
SELECT 
    id,
    name,
    brand,
    product_code,
    is_active,
    created_at
FROM products
ORDER BY name;

-- Check if product variants exist
SELECT 
    'Product Variants Count' as check_type,
    COUNT(*) as total_variants,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_variants
FROM product_variants;

-- Show product variants with pricing
SELECT 
    pv.id,
    pv.sku,
    pv.variant_name,
    pv.selling_price,
    pv.quantity_in_stock,
    p.name as product_name
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY p.name, pv.variant_name;

-- Test search functionality
SELECT 
    'Search Test' as check_type,
    COUNT(*) as search_results
FROM products
WHERE name ILIKE '%iPhone%' OR brand ILIKE '%Apple%';

-- Success message
SELECT 'Product check completed!' as status; 