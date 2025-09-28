-- SUPABASE 400 ERROR FIX
-- The issue is with complex nested queries in Supabase REST API
-- This file provides working solutions

-- PROBLEM: The current query is too complex for Supabase REST API
-- Current failing query: 
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

-- SOLUTION 1: Simplified query with basic relationships only
-- This should work with Supabase REST API
SELECT 
    s.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 100;

-- SOLUTION 2: Get sale items separately (recommended approach)
-- Query 1: Get sales with basic customer info
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
    c.phone as customer_phone
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 100;

-- Query 2: Get sale items for specific sales
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
WHERE si.sale_id IN (
    SELECT id FROM lats_sales 
    ORDER BY created_at DESC 
    LIMIT 100
);

-- Query 3: Get product details for sale items
SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.barcode,
    p.category_id,
    p.is_active,
    p.created_at,
    p.updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE si.sale_id IN (
    SELECT id FROM lats_sales 
    ORDER BY created_at DESC 
    LIMIT 100
);

-- Query 4: Get product variants for sale items
SELECT 
    pv.id,
    pv.product_id,
    pv.name,
    pv.sku,
    pv.barcode,
    pv.attributes,
    pv.created_at,
    pv.updated_at
FROM lats_sale_items si
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id IN (
    SELECT id FROM lats_sales 
    ORDER BY created_at DESC 
    LIMIT 100
);

-- SOLUTION 3: Alternative single query with minimal nesting
-- This might work if you need everything in one query
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
    -- Use JSON aggregation for sale items (simpler than nested selects)
    (
        SELECT json_agg(
            json_build_object(
                'id', si.id,
                'product_id', si.product_id,
                'variant_id', si.variant_id,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.total_price
            )
        )
        FROM lats_sale_items si
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 100;

-- SOLUTION 4: Test with the specific failing sale ID
-- This will help debug the specific issue
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    c.phone as customer_phone
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- Get sale items for the specific sale
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    p.name as product_name,
    p.description as product_description,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.attributes as variant_attributes
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- RECOMMENDATIONS:
-- 1. Use separate API calls instead of complex nested queries
-- 2. Start with basic sales data, then fetch related data separately
-- 3. Use the simplified queries above in your frontend
-- 4. Consider using Supabase's real-time subscriptions for better performance
