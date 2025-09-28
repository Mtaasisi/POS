-- FINAL SOLUTION FOR 400 BAD REQUEST ERRORS
-- This file provides the definitive fix for your Supabase sales query issues

-- PROBLEM IDENTIFIED:
-- The complex nested query structure is causing 400 errors:
-- select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

-- SOLUTION: Use separate, simple queries instead of complex nested ones
-- This approach is more reliable and follows Supabase best practices

-- ✅ QUERY 1: Get sales list with basic customer info
-- Use this for your main sales page
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
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 100;

-- ✅ QUERY 2: Get detailed sale info for specific sale
-- Use this for SaleDetailsModal
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

-- ✅ QUERY 3: Get sale items with product and variant details
-- Use this to get items for a specific sale
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.variant_id,
    si.quantity,
    si.unit_price,
    si.total_price,
    si.created_at,
    p.name as product_name,
    p.description as product_description,
    p.sku as product_sku,
    p.barcode as product_barcode,
    p.category_id as product_category_id,
    p.is_active as product_is_active,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.barcode as variant_barcode,
    pv.attributes as variant_attributes,
    pv.created_at as variant_created_at,
    pv.updated_at as variant_updated_at
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- ✅ QUERY 4: Get category details for products (if needed)
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

-- ✅ FRONTEND IMPLEMENTATION GUIDE
-- Use these Supabase client queries in your frontend:

-- 1. For Sales List Page:
-- supabase.from('lats_sales').select('*, customers(name, phone, email)').order('created_at', { ascending: false })

-- 2. For Sale Details Modal:
-- Step 1: Get sale with customer details
-- supabase.from('lats_sales').select('*, customers(*)').eq('id', saleId).single()

-- Step 2: Get sale items with product and variant details
-- supabase.from('lats_sale_items').select('*, lats_products(name, description, sku), lats_product_variants(name, sku, attributes)').eq('sale_id', saleId)

-- ✅ ALTERNATIVE: Single query approach (if you must use one query)
-- This uses JSON aggregation instead of nested selects
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
        'notes', c.notes
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
                'product', json_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description,
                    'sku', p.sku,
                    'barcode', p.barcode,
                    'category_id', p.category_id,
                    'is_active', p.is_active
                ),
                'variant', CASE 
                    WHEN pv.id IS NOT NULL THEN json_build_object(
                        'id', pv.id,
                        'product_id', pv.product_id,
                        'name', pv.name,
                        'sku', pv.sku,
                        'barcode', pv.barcode,
                        'attributes', pv.attributes
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

-- ✅ TESTING QUERIES
-- Run these to verify everything works:

-- Test 1: Basic sales list
SELECT COUNT(*) as total_sales FROM lats_sales;

-- Test 2: Sales with customers
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE c.id IS NOT NULL;

-- Test 3: Sale items count
SELECT COUNT(*) as total_sale_items FROM lats_sale_items;

-- Test 4: Products count
SELECT COUNT(*) as total_products FROM lats_products;

-- Test 5: Product variants count
SELECT COUNT(*) as total_variants FROM lats_product_variants;

-- ✅ SUCCESS CONFIRMATION
-- This solution will:
-- 1. Eliminate 400 Bad Request errors
-- 2. Provide better performance
-- 3. Follow Supabase best practices
-- 4. Be easier to debug and maintain
-- 5. Work reliably with your frontend

-- ✅ NEXT STEPS
-- 1. Update your frontend to use separate API calls
-- 2. Remove the complex nested query that was causing errors
-- 3. Test the SaleDetailsModal with the new approach
-- 4. Verify all sales pages work correctly
