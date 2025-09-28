-- QUICK DATABASE DIAGNOSTIC
-- Run this first for immediate results

-- 1. Check if all tables exist
SELECT 'TABLE CHECK' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') 
            THEN '✅ lats_sales' ELSE '❌ lats_sales MISSING' END as result
UNION ALL
SELECT 'TABLE CHECK', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sale_items') 
            THEN '✅ lats_sale_items' ELSE '❌ lats_sale_items MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_products') 
            THEN '✅ lats_products' ELSE '❌ lats_products MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') 
            THEN '✅ lats_product_variants' ELSE '❌ lats_product_variants MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
            THEN '✅ customers' ELSE '❌ customers MISSING' END;

-- 2. Test the complex query that was failing
SELECT 'COMPLEX QUERY TEST' as test,
       CASE 
           WHEN COUNT(*) >= 0 THEN '✅ Complex query works'
           ELSE '❌ Complex query failed'
       END as result
FROM lats_sales 
LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id;

-- 3. Check for data issues
SELECT 'DATA INTEGRITY' as test,
       CASE WHEN COUNT(*) = 0 THEN '✅ No orphaned sale items' 
            ELSE '❌ ' || COUNT(*) || ' orphaned sale items' END as result
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL;

-- 4. Check record counts
SELECT 'RECORD COUNT' as test, 'lats_sales: ' || COUNT(*) as result FROM lats_sales
UNION ALL
SELECT 'RECORD COUNT', 'lats_sale_items: ' || COUNT(*) FROM lats_sale_items
UNION ALL
SELECT 'RECORD COUNT', 'lats_products: ' || COUNT(*) FROM lats_products
UNION ALL
SELECT 'RECORD COUNT', 'customers: ' || COUNT(*) FROM customers;
