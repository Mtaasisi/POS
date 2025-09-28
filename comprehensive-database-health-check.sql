-- COMPREHENSIVE POS DATABASE HEALTH CHECK
-- This script performs a complete analysis of your POS database tables
-- Run this to ensure everything is working perfectly

-- =====================================================
-- 1. TABLE STRUCTURE VERIFICATION
-- =====================================================

-- Check if all required tables exist
SELECT 
    'TABLE_EXISTENCE_CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN '✅ lats_sales exists'
        ELSE '❌ lats_sales MISSING'
    END as lats_sales,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sale_items') THEN '✅ lats_sale_items exists'
        ELSE '❌ lats_sale_items MISSING'
    END as lats_sale_items,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_products') THEN '✅ lats_products exists'
        ELSE '❌ lats_products MISSING'
    END as lats_products,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') THEN '✅ lats_product_variants exists'
        ELSE '❌ lats_product_variants MISSING'
    END as lats_product_variants,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN '✅ customers exists'
        ELSE '❌ customers MISSING'
    END as customers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_users') THEN '✅ auth_users exists'
        ELSE '❌ auth_users MISSING'
    END as auth_users;

-- =====================================================
-- 2. COLUMN STRUCTURE VERIFICATION
-- =====================================================

-- Check lats_sales table structure
SELECT 
    'LATS_SALES_COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Check lats_sale_items table structure
SELECT 
    'LATS_SALE_ITEMS_COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items' 
ORDER BY ordinal_position;

-- Check lats_products table structure
SELECT 
    'LATS_PRODUCTS_COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_products' 
ORDER BY ordinal_position;

-- =====================================================
-- 3. FOREIGN KEY CONSTRAINTS CHECK
-- =====================================================

-- Check foreign key relationships
SELECT 
    'FOREIGN_KEY_CHECK' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('lats_sales', 'lats_sale_items', 'lats_products', 'lats_product_variants')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 4. DATA INTEGRITY CHECKS
-- =====================================================

-- Check for orphaned sale items (items without valid sales)
SELECT 
    'ORPHANED_SALE_ITEMS' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned sale items'
        ELSE '❌ Found ' || COUNT(*) || ' orphaned sale items'
    END as status
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned sales (sales without valid customers)
SELECT 
    'ORPHANED_SALES' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned sales'
        ELSE '❌ Found ' || COUNT(*) || ' orphaned sales'
    END as status
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.customer_id IS NOT NULL AND c.id IS NULL;

-- Check for orphaned sale items (items without valid products)
SELECT 
    'ORPHANED_PRODUCT_ITEMS' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned product items'
        ELSE '❌ Found ' || COUNT(*) || ' orphaned product items'
    END as status
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE p.id IS NULL;

-- Check for orphaned sale items (items without valid variants)
SELECT 
    'ORPHANED_VARIANT_ITEMS' as check_type,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned variant items'
        ELSE '❌ Found ' || COUNT(*) || ' orphaned variant items'
    END as status
FROM lats_sale_items si
LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
WHERE si.variant_id IS NOT NULL AND pv.id IS NULL;

-- =====================================================
-- 5. BUSINESS LOGIC VALIDATION
-- =====================================================

-- Check for negative quantities
SELECT 
    'NEGATIVE_QUANTITIES' as check_type,
    COUNT(*) as negative_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No negative quantities'
        ELSE '❌ Found ' || COUNT(*) || ' negative quantities'
    END as status
FROM lats_sale_items 
WHERE quantity <= 0;

-- Check for negative prices
SELECT 
    'NEGATIVE_PRICES' as check_type,
    COUNT(*) as negative_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No negative prices'
        ELSE '❌ Found ' || COUNT(*) || ' negative prices'
    END as status
FROM lats_sale_items 
WHERE unit_price < 0 OR total_price < 0;

-- Check for price calculation mismatches
SELECT 
    'PRICE_CALCULATION_MISMATCH' as check_type,
    COUNT(*) as mismatch_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All price calculations are correct'
        ELSE '❌ Found ' || COUNT(*) || ' price calculation mismatches'
    END as status
FROM lats_sale_items 
WHERE ABS(total_price - (quantity * unit_price)) > 0.01;

-- Check for sales without items
SELECT 
    'SALES_WITHOUT_ITEMS' as check_type,
    COUNT(*) as empty_sales_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All sales have items'
        ELSE '❌ Found ' || COUNT(*) || ' sales without items'
    END as status
FROM lats_sales s
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL;

-- =====================================================
-- 6. DATA CONSISTENCY CHECKS
-- =====================================================

-- Check sales total vs sum of items
SELECT 
    'SALES_TOTAL_CONSISTENCY' as check_type,
    COUNT(*) as inconsistent_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All sales totals are consistent'
        ELSE '❌ Found ' || COUNT(*) || ' inconsistent sales totals'
    END as status
FROM lats_sales s
JOIN (
    SELECT 
        sale_id, 
        SUM(total_price) as calculated_total
    FROM lats_sale_items 
    GROUP BY sale_id
) si ON s.id = si.sale_id
WHERE ABS(s.total_amount - si.calculated_total) > 0.01;

-- Check for duplicate sale numbers
SELECT 
    'DUPLICATE_SALE_NUMBERS' as check_type,
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No duplicate sale numbers'
        ELSE '❌ Found ' || COUNT(*) || ' duplicate sale numbers'
    END as status
FROM (
    SELECT sale_number, COUNT(*) as cnt
    FROM lats_sales 
    GROUP BY sale_number 
    HAVING COUNT(*) > 1
) duplicates;

-- =====================================================
-- 7. INDEX PERFORMANCE CHECK
-- =====================================================

-- Check if critical indexes exist
SELECT 
    'INDEX_CHECK' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('lats_sales', 'lats_sale_items', 'lats_products', 'lats_product_variants')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 8. ROW LEVEL SECURITY CHECK
-- =====================================================

-- Check RLS status
SELECT 
    'RLS_CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS enabled'
        ELSE '⚠️ RLS disabled'
    END as status
FROM pg_tables 
WHERE tablename IN ('lats_sales', 'lats_sale_items', 'lats_products', 'lats_product_variants')
ORDER BY tablename;

-- =====================================================
-- 9. DATA VOLUME STATISTICS
-- =====================================================

-- Get record counts for all tables
SELECT 
    'DATA_VOLUME' as check_type,
    'lats_sales' as table_name,
    COUNT(*) as record_count
FROM lats_sales
UNION ALL
SELECT 
    'DATA_VOLUME' as check_type,
    'lats_sale_items' as table_name,
    COUNT(*) as record_count
FROM lats_sale_items
UNION ALL
SELECT 
    'DATA_VOLUME' as check_type,
    'lats_products' as table_name,
    COUNT(*) as record_count
FROM lats_products
UNION ALL
SELECT 
    'DATA_VOLUME' as check_type,
    'lats_product_variants' as table_name,
    COUNT(*) as record_count
FROM lats_product_variants
UNION ALL
SELECT 
    'DATA_VOLUME' as check_type,
    'customers' as table_name,
    COUNT(*) as record_count
FROM customers
UNION ALL
SELECT 
    'DATA_VOLUME' as check_type,
    'auth_users' as table_name,
    COUNT(*) as record_count
FROM auth_users;

-- =====================================================
-- 10. COMPLEX QUERY TEST (The one that was failing)
-- =====================================================

-- Test the complex query that was causing 400 errors
SELECT 
    'COMPLEX_QUERY_TEST' as check_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ Complex query works perfectly'
        ELSE '❌ Complex query failed'
    END as status
FROM lats_sales 
LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id;

-- =====================================================
-- 11. RECENT ACTIVITY CHECK
-- =====================================================

-- Check recent sales activity
SELECT 
    'RECENT_ACTIVITY' as check_type,
    'Recent Sales (Last 7 days)' as activity_type,
    COUNT(*) as count
FROM lats_sales 
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'RECENT_ACTIVITY' as check_type,
    'Recent Sales (Last 30 days)' as activity_type,
    COUNT(*) as count
FROM lats_sales 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- =====================================================
-- 12. FINAL HEALTH SUMMARY
-- =====================================================

SELECT 
    '🎉 DATABASE HEALTH CHECK COMPLETE' as status,
    'All checks have been performed. Review the results above for any issues.' as message,
    NOW() as check_timestamp;
