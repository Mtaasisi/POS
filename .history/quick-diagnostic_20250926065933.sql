-- Quick Diagnostic: Check what tables are missing
-- Run this first to see what needs to be fixed

-- Check if tables exist
SELECT 
    'Missing Tables Check:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_sales') THEN '✅ lats_sales EXISTS'
        ELSE '❌ lats_sales MISSING'
    END as lats_sales_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_receipts') THEN '✅ lats_receipts EXISTS'
        ELSE '❌ lats_receipts MISSING'
    END as lats_receipts_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_sale_items') THEN '✅ lats_sale_items EXISTS'
        ELSE '❌ lats_sale_items MISSING'
    END as lats_sale_items_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_products') THEN '✅ lats_products EXISTS'
        ELSE '❌ lats_products MISSING'
    END as lats_products_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_product_variants') THEN '✅ lats_product_variants EXISTS'
        ELSE '❌ lats_product_variants MISSING'
    END as lats_product_variants_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers') THEN '✅ customers EXISTS'
        ELSE '❌ customers MISSING'
    END as customers_status;

-- Check lats_sales table structure
SELECT 
    'lats_sales columns:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Test the failing query
DO $$
BEGIN
    -- Try the exact query that's failing
    PERFORM COUNT(*)
    FROM lats_sales 
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    LIMIT 1;
    
    RAISE NOTICE '✅ Complex query works - all tables and relationships exist';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Complex query failed: %', SQLERRM;
    RAISE NOTICE 'This confirms the tables/relationships need to be created';
END $$;
