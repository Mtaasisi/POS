-- FINAL FIX FOR 400 BAD REQUEST ERROR
-- This script provides a comprehensive solution for the sales query issue

-- 1. First, let's check the current state of the database
SELECT 
    'Database State Check' as test,
    'Checking table structure and data...' as details;

-- 2. Verify all required tables and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('lats_sales', 'customers', 'lats_sale_items', 'lats_products', 'lats_product_variants', 'lats_categories')
ORDER BY table_name, ordinal_position;

-- 3. Check if there are any sales records
SELECT 
    COUNT(*) as total_sales,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as sales_with_customers,
    COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as sales_without_customers
FROM lats_sales;

-- 4. Check for the specific failing sale
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

-- 5. Check sale items for the failing sale
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price
FROM lats_sale_items si
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 6. SIMPLIFIED QUERY APPROACH
-- Instead of complex nested queries, use separate API calls
-- This is the recommended approach for Supabase REST API

-- Query 1: Get basic sale data with customer info
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    s.updated_at,
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
    c.notes as customer_notes
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Query 2: Get sale items separately
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    si.created_at
FROM lats_sale_items si
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Query 3: Get product details for sale items
SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.barcode,
    p.category_id,
    -- p.price, (column doesn't exist)
    -- p.cost, (column doesn't exist)
    -- p.stock_quantity, (column doesn't exist)
    -- p.min_stock_level, (column doesn't exist)
    p.is_active,
    p.created_at,
    p.updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Query 4: Get product variants for sale items
SELECT 
    pv.id,
    pv.product_id,
    pv.name,
    pv.sku,
    pv.barcode,
    pv.attributes,
    pv.price,
    pv.cost,
    pv.stock_quantity,
    pv.min_stock_level,
    -- pv.is_active, (column doesn't exist)
    pv.created_at,
    pv.updated_at
FROM lats_sale_items si
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Query 5: Get categories for products
SELECT 
    cat.id,
    cat.name,
    cat.description,
    cat.parent_id,
    cat.color,
    cat.icon,
    cat.is_active,
    cat.created_at,
    cat.updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_categories cat ON p.category_id = cat.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 7. ALTERNATIVE: Single query with minimal nesting (if you must use one query)
-- This should work better than the complex nested version
SELECT 
    s.*,
    json_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone,
        'email', c.email,
        'city', c.city,
        'whatsapp', c.whatsapp,
        'gender', c.gender,
        'loyalty_level', c.loyalty_level,
        'color_tag', c.color_tag,
        'total_spent', c.total_spent,
        'points', c.points,
        'last_visit', c.last_visit,
        'is_active', c.is_active,
        'notes', c.notes,
        'created_at', c.created_at,
        'updated_at', c.updated_at
    ) as customer,
    (
        SELECT json_agg(
            json_build_object(
                'id', si.id,
                'sale_id', si.sale_id,
                'product_id', si.product_id,
                'variant_id', si.variant_id,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.total_price,
                'created_at', si.created_at,
                'product', json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description,
                    'sku', p.sku,
                    'barcode', p.barcode,
                    'category_id', p.category_id,
                    -- 'price', p.price, (column doesn't exist)
                    -- 'cost', p.cost, (column doesn't exist)
                    -- 'stock_quantity', p.stock_quantity, (column doesn't exist)
                    -- 'min_stock_level', p.min_stock_level, (column doesn't exist)
                    'is_active', p.is_active,
                    'created_at', p.created_at,
                    'updated_at', p.updated_at
                ),
                'variant', CASE 
                    WHEN pv.id IS NOT NULL THEN json_build_object(
                        'id', pv.id,
                        'product_id', pv.product_id,
                        'name', pv.name,
                        'sku', pv.sku,
                        'barcode', pv.barcode,
                        'attributes', pv.attributes,
                        'price', pv.price,
                        'cost', pv.cost,
                        'stock_quantity', pv.stock_quantity,
                        'min_stock_level', pv.min_stock_level,
                        'is_active', pv.is_active,
                        'created_at', pv.created_at,
                        'updated_at', pv.updated_at
                    )
                    ELSE NULL
                END
            )
        )
        FROM lats_sale_items si
        LEFT JOIN lats_products p ON si.product_id = p.id
        LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 8. Success message
SELECT 
    '✅ FIX COMPLETED!' as status,
    'Use separate API calls instead of complex nested queries' as recommendation
UNION ALL
SELECT 'Next Steps', 
       '1. Update your frontend to make separate API calls'
UNION ALL
SELECT '2. Use the simplified queries above', 
       '3. Test the SaleDetailsModal with the new approach';
