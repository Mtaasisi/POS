-- =====================================================
-- COMPREHENSIVE STOCK VALUE CALCULATION
-- =====================================================
-- This script calculates the total stock value of all products
-- using multiple methods for verification

-- Method 1: Calculate from Product Variants (Most Accurate)
-- =====================================================
SELECT 
    'Method 1: Product Variants' as calculation_method,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT pv.id) as total_variants,
    SUM(pv.quantity) as total_quantity,
    SUM(pv.cost_price * pv.quantity) as total_cost_value,
    SUM(pv.selling_price * pv.quantity) as total_retail_value,
    ROUND(AVG(pv.cost_price), 2) as avg_cost_price,
    ROUND(AVG(pv.selling_price), 2) as avg_selling_price
FROM lats_products p
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true;

-- Method 2: Calculate from Inventory Items (Serial Number Tracking)
-- =====================================================
SELECT 
    'Method 2: Inventory Items' as calculation_method,
    COUNT(DISTINCT ii.product_id) as total_products,
    COUNT(ii.id) as total_items,
    SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END) as available_items,
    SUM(CASE WHEN ii.status = 'available' THEN ii.cost_price ELSE 0 END) as available_cost_value,
    SUM(CASE WHEN ii.status = 'available' THEN ii.selling_price ELSE 0 END) as available_retail_value,
    SUM(CASE WHEN ii.status = 'sold' THEN 1 ELSE 0 END) as sold_items,
    SUM(CASE WHEN ii.status = 'damaged' THEN 1 ELSE 0 END) as damaged_items
FROM inventory_items ii
JOIN lats_products p ON ii.product_id = p.id
WHERE p.is_active = true;

-- Method 3: Using Product Total Value (Pre-calculated)
-- =====================================================
SELECT 
    'Method 3: Product Total Value' as calculation_method,
    COUNT(p.id) as total_products,
    SUM(p.total_quantity) as total_quantity,
    SUM(p.total_value) as total_value,
    ROUND(AVG(p.total_value), 2) as avg_product_value
FROM lats_products p
WHERE p.is_active = true;

-- Method 4: Detailed Breakdown by Category
-- =====================================================
SELECT 
    c.name as category_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT pv.id) as variant_count,
    SUM(pv.quantity) as total_quantity,
    SUM(pv.cost_price * pv.quantity) as total_cost_value,
    SUM(pv.selling_price * pv.quantity) as total_retail_value,
    ROUND(SUM(pv.cost_price * pv.quantity) / NULLIF(SUM(pv.quantity), 0), 2) as avg_cost_per_unit
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY c.id, c.name
ORDER BY total_cost_value DESC;

-- Method 5: Detailed Breakdown by Brand
-- =====================================================
SELECT 
    b.name as brand_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT pv.id) as variant_count,
    SUM(pv.quantity) as total_quantity,
    SUM(pv.cost_price * pv.quantity) as total_cost_value,
    SUM(pv.selling_price * pv.quantity) as total_retail_value,
    ROUND(SUM(pv.cost_price * pv.quantity) / NULLIF(SUM(pv.quantity), 0), 2) as avg_cost_per_unit
FROM lats_products p
LEFT JOIN lats_brands b ON p.brand_id = b.id
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY b.id, b.name
ORDER BY total_cost_value DESC;

-- Method 6: Stock Status Summary
-- =====================================================
SELECT 
    'Stock Status Summary' as summary_type,
    COUNT(CASE WHEN pv.quantity = 0 THEN 1 END) as out_of_stock_products,
    COUNT(CASE WHEN pv.quantity > 0 AND pv.quantity <= 5 THEN 1 END) as low_stock_products,
    COUNT(CASE WHEN pv.quantity > 5 THEN 1 END) as well_stocked_products,
    COUNT(CASE WHEN pv.quantity > 50 THEN 1 END) as overstocked_products
FROM lats_products p
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true;

-- Method 7: Top 10 Most Valuable Products
-- =====================================================
SELECT 
    p.name as product_name,
    p.sku,
    c.name as category,
    b.name as brand,
    COUNT(pv.id) as variant_count,
    SUM(pv.quantity) as total_quantity,
    SUM(pv.cost_price * pv.quantity) as total_cost_value,
    SUM(pv.selling_price * pv.quantity) as total_retail_value,
    ROUND(SUM(pv.selling_price * pv.quantity) - SUM(pv.cost_price * pv.quantity), 2) as potential_profit
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_brands b ON p.brand_id = b.id
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.sku, c.name, b.name
ORDER BY total_cost_value DESC
LIMIT 10;

-- Method 8: Currency Conversion Summary (if applicable)
-- =====================================================
-- This assumes you might have different currencies in your system
SELECT 
    'Currency Summary' as summary_type,
    COUNT(DISTINCT p.id) as products_with_currency_data,
    SUM(p.total_value) as total_value_in_base_currency,
    ROUND(AVG(p.total_value), 2) as avg_value_per_product
FROM lats_products p
WHERE p.is_active = true 
  AND p.total_value > 0;
