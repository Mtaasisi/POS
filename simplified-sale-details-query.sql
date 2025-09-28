-- SIMPLIFIED SALE DETAILS QUERY FIX
-- This provides a working alternative to the complex nested query

-- 1. Test the exact sale ID that's failing
SELECT 
    'Testing Sale ID: cbcb1387-37c0-4b96-a65a-8379e0439bed' as test;

-- 2. Check if the sale exists with basic query
SELECT 
    id,
    sale_number,
    customer_id,
    subtotal,
    total_amount,
    status,
    created_at
FROM lats_sales 
WHERE id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 3. Check customer data for this sale
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.city,
    c.whatsapp,
    c.gender,
    c.loyalty_level,
    c.color_tag,
    c.total_spent,
    c.points,
    c.last_visit,
    c.is_active,
    c.notes,
    c.created_at,
    c.updated_at
FROM lats_sales s
JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 4. Check sale items for this sale
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    si.discount_amount,
    si.discount_type,
    si.discount_value,
    si.tax_amount,
    si.created_at,
    si.updated_at
FROM lats_sale_items si
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 5. Check products for sale items
SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.barcode,
    p.category_id,
    p.unit_price,
    p.cost_price,
    p.stock_quantity,
    p.min_stock_level,
    p.is_active,
    p.created_at,
    p.updated_at
FROM lats_sale_items si
JOIN lats_products p ON si.product_id = p.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 6. Check categories for products
SELECT 
    cat.id,
    cat.name,
    cat.description,
    cat.parent_id,
    cat.created_at
FROM lats_sale_items si
JOIN lats_products p ON si.product_id = p.id
JOIN lats_categories cat ON p.category_id = cat.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 7. Check product variants
SELECT 
    pv.id,
    pv.product_id,
    pv.name,
    pv.sku,
    pv.barcode,
    pv.unit_price,
    pv.cost_price,
    pv.stock_quantity,
    -- pv.is_active, (column doesn't exist)
    pv.created_at,
    pv.updated_at
FROM lats_sale_items si
JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 8. Test a simplified version of the complex query
-- This should work better than the nested version
SELECT 
    s.*,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    c.city as customer_city,
    c.whatsapp as customer_whatsapp,
    c.gender as customer_gender,
    c.loyalty_level as customer_loyalty_level,
    c.color_tag as customer_color_tag,
    c.total_spent as customer_total_spent,
    c.points as customer_points,
    c.last_visit as customer_last_visit,
    c.is_active as customer_is_active,
    c.notes as customer_notes,
    c.created_at as customer_created_at,
    c.updated_at as customer_updated_at
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 9. Test sale items with products (simplified)
SELECT 
    si.*,
    p.id as product_id,
    p.name as product_name,
    p.description as product_description,
    p.sku as product_sku,
    p.barcode as product_barcode,
    p.category_id as product_category_id,
    p.unit_price as product_unit_price,
    p.cost_price as product_cost_price,
    p.stock_quantity as product_stock_quantity,
    p.min_stock_level as product_min_stock_level,
    p.is_active as product_is_active,
    p.created_at as product_created_at,
    p.updated_at as product_updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 10. Test sale items with variants (simplified)
SELECT 
    si.*,
    pv.id as variant_id,
    pv.product_id as variant_product_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.barcode as variant_barcode,
    pv.unit_price as variant_unit_price,
    pv.cost_price as variant_cost_price,
    pv.stock_quantity as variant_stock_quantity,
    -- pv.is_active as variant_is_active, (column doesn't exist)
    pv.created_at as variant_created_at,
    pv.updated_at as variant_updated_at
FROM lats_sale_items si
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 11. Final recommendation
SELECT 
    '🎉 SIMPLIFIED QUERY TESTS COMPLETED!' as status,
    'Use these simplified queries instead of complex nested ones' as details
UNION ALL
SELECT 'Recommendation', 
       'Split the complex query into multiple simpler queries'
UNION ALL
SELECT 'Next Step', 
       'Update SaleDetailsModal to use simplified approach';
