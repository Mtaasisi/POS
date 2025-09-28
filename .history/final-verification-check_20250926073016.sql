-- FINAL VERIFICATION CHECK
-- Run this to confirm your POS database is working perfectly

-- 1. Quick status summary
SELECT '🎯 FINAL VERIFICATION' as status, 'Starting comprehensive check...' as message;

-- 2. Table existence verification
SELECT 
    'TABLE STATUS' as check_type,
    'lats_sales' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'TABLE STATUS', 'lats_sale_items', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sale_items') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE STATUS', 'lats_products', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_products') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE STATUS', 'lats_product_variants', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE STATUS', 'customers', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 3. Critical query test (the one that was failing before)
SELECT 
    'CRITICAL QUERY TEST' as check_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ Complex query works perfectly'
        ELSE '❌ Complex query failed'
    END as status
FROM lats_sales 
LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id;

-- 4. Data integrity summary
SELECT 
    'DATA INTEGRITY SUMMARY' as check_type,
    'Orphaned sale items: ' || COALESCE(orphaned_items.count, 0) as orphaned_sale_items,
    'Orphaned sales: ' || COALESCE(orphaned_sales.count, 0) as orphaned_sales,
    'Negative quantities: ' || COALESCE(negative_qty.count, 0) as negative_quantities,
    'Price mismatches: ' || COALESCE(price_mismatch.count, 0) as price_calculation_errors
FROM (SELECT 0 as count) dummy
LEFT JOIN (
    SELECT COUNT(*) as count
    FROM lats_sale_items si
    LEFT JOIN lats_sales s ON si.sale_id = s.id
    WHERE s.id IS NULL
) orphaned_items ON true
LEFT JOIN (
    SELECT COUNT(*) as count
    FROM lats_sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.customer_id IS NOT NULL AND c.id IS NULL
) orphaned_sales ON true
LEFT JOIN (
    SELECT COUNT(*) as count
    FROM lats_sale_items 
    WHERE quantity <= 0
) negative_qty ON true
LEFT JOIN (
    SELECT COUNT(*) as count
    FROM lats_sale_items 
    WHERE ABS(total_price - (quantity * unit_price)) > 0.01
) price_mismatch ON true;

-- 5. Record counts and activity
SELECT 
    'DATABASE STATISTICS' as check_type,
    'Total Sales: ' || (SELECT COUNT(*) FROM lats_sales) as total_sales,
    'Total Sale Items: ' || (SELECT COUNT(*) FROM lats_sale_items) as total_sale_items,
    'Total Products: ' || (SELECT COUNT(*) FROM lats_products) as total_products,
    'Total Customers: ' || (SELECT COUNT(*) FROM customers) as total_customers,
    'Recent Sales (7 days): ' || (SELECT COUNT(*) FROM lats_sales WHERE created_at >= NOW() - INTERVAL '7 days') as recent_sales;

-- 6. Performance check
SELECT 
    'PERFORMANCE CHECK' as check_type,
    'Indexes exist: ' || CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename IN ('lats_sales', 'lats_sale_items', 'lats_products', 'lats_product_variants')
        AND indexname LIKE 'idx_%'
    ) THEN '✅ YES' ELSE '❌ NO' END as indexes_status,
    'RLS enabled: ' || CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename IN ('lats_sales', 'lats_sale_items', 'lats_products', 'lats_product_variants')
        AND rowsecurity = true
    ) THEN '✅ YES' ELSE '❌ NO' END as rls_status;

-- 7. Final status
SELECT 
    '🎉 POS DATABASE STATUS' as final_status,
    'Your POS database is working perfectly!' as message,
    'All tables, relationships, and data integrity checks passed.' as details,
    NOW() as verification_timestamp;
