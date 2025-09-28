-- SALES QUERY FIX IMPLEMENTATION
-- This file shows the exact queries to use in your application

-- PROBLEM: The complex nested query causes 400 Bad Request
-- ORIGINAL QUERY (CAUSES 400 ERROR):
-- lats_sales?select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

-- SOLUTION: Use separate API calls instead of complex nested queries

-- 1. FIRST API CALL: Get basic sale data with customer info
-- URL: /rest/v1/lats_sales?select=*,customers(*)
-- This query gets the sale and customer data in one call
SELECT 
    s.*,
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

-- 2. SECOND API CALL: Get sale items
-- URL: /rest/v1/lats_sale_items?select=*&sale_id=eq.cbcb1387-37c0-4b96-a65a-8379e0439bed
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

-- 3. THIRD API CALL: Get product details for each sale item
-- URL: /rest/v1/lats_products?select=*&id=in.(product_ids_from_step_2)
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
FROM lats_products p
WHERE p.id IN (
    SELECT DISTINCT product_id 
    FROM lats_sale_items 
    WHERE sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed'
);

-- 4. FOURTH API CALL: Get product variants for each sale item
-- URL: /rest/v1/lats_product_variants?select=*&id=in.(variant_ids_from_step_2)
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
FROM lats_product_variants pv
WHERE pv.id IN (
    SELECT DISTINCT variant_id 
    FROM lats_sale_items 
    WHERE sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed'
    AND variant_id IS NOT NULL
);

-- 5. FIFTH API CALL: Get categories for products
-- URL: /rest/v1/lats_categories?select=*&id=in.(category_ids_from_step_3)
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
FROM lats_categories cat
WHERE cat.id IN (
    SELECT DISTINCT p.category_id 
    FROM lats_products p
    WHERE p.id IN (
        SELECT DISTINCT product_id 
        FROM lats_sale_items 
        WHERE sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed'
    )
);

-- ALTERNATIVE: If you must use a single query, use this simplified version
-- This avoids the deep nesting that causes the 400 error
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
                'created_at', si.created_at
            )
        )
        FROM lats_sale_items si
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- IMPLEMENTATION NOTES:
-- 1. The 400 error occurs because Supabase REST API has limits on query complexity
-- 2. Complex nested queries with multiple joins can exceed these limits
-- 3. The solution is to break the query into multiple simpler API calls
-- 4. This approach is actually better for performance and maintainability
-- 5. You can combine the results in your frontend code

-- FRONTEND IMPLEMENTATION EXAMPLE:
-- 1. Make API call 1 to get sale + customer data
-- 2. Make API call 2 to get sale items
-- 3. Extract product IDs and variant IDs from sale items
-- 4. Make API call 3 to get product details
-- 5. Make API call 4 to get variant details (if any)
-- 6. Make API call 5 to get category details (if needed)
-- 7. Combine all data in your frontend component

-- This approach will resolve the 400 Bad Request error and improve performance
