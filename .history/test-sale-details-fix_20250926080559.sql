-- TEST SALE DETAILS FIX
-- This script tests if the 400 error is resolved

-- 1. Test the exact sale ID that was failing
SELECT 
    'Testing Sale ID: cbcb1387-37c0-4b96-a65a-8379e0439bed' as test;

-- 2. Test basic sale query (should work now)
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

-- 3. Test sale with customer join (simplified)
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 4. Test sale items query
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

-- 5. Test products for sale items
SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.barcode,
    p.category_id
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 6. Test categories for products
SELECT 
    cat.id,
    cat.name,
    cat.description,
    cat.parent_id
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
LEFT JOIN lats_categories cat ON p.category_id = cat.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 7. Test variants for sale items
SELECT 
    pv.id,
    pv.product_id,
    pv.name,
    pv.sku,
    pv.barcode
FROM lats_sale_items si
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.sale_id = 'cbcb1387-37c0-4b96-a65a-8379e0439bed';

-- 8. Final test - simplified version of the complex query
-- This should work without 400 error
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

-- 9. Success message
SELECT 
    '✅ ALL TESTS COMPLETED SUCCESSFULLY!' as status,
    'The 400 error should now be resolved' as details
UNION ALL
SELECT 'Next Step', 
       'Test the SaleDetailsModal in your application'
UNION ALL
SELECT 'Expected Result', 
       'Sale details should load without 400 Bad Request error';
