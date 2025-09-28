-- ANALYZE EMPTY SALES TABLES
-- This script investigates why lats_sales and lats_sale_items are empty

-- 1. Check if there are any sales in other related tables
SELECT 
    'Data Analysis' as test,
    'Checking for sales data in related tables...' as details;

-- 2. Check if there are any sales in the main sales table (if it exists)
SELECT 
    'Sales Table Check' as test,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') 
         THEN '✅ sales table exists' ELSE '❌ sales table missing' END as result
UNION ALL
SELECT 'Sales Table Check', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_items') 
            THEN '✅ sale_items table exists' ELSE '❌ sale_items table missing' END;

-- 3. If sales table exists, check its contents
DO $$
DECLARE
    sales_count INTEGER := 0;
    sale_items_count INTEGER := 0;
BEGIN
    -- Check main sales table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        SELECT COUNT(*) INTO sales_count FROM sales;
        RAISE NOTICE '📊 Main sales table has % records', sales_count;
    END IF;
    
    -- Check sale_items table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_items') THEN
        SELECT COUNT(*) INTO sale_items_count FROM sale_items;
        RAISE NOTICE '📊 Main sale_items table has % records', sale_items_count;
    END IF;
END $$;

-- 4. Check for any tables that might contain sales data
SELECT 
    'Related Tables Check' as test,
    table_name as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%sale%' OR table_name LIKE '%transaction%' OR table_name LIKE '%order%')
ORDER BY table_name;

-- 5. Check if there are any sales in the lats_sales table with different structure
SELECT 
    'LATS Sales Structure Check' as test,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' AND column_name = 'id'
    ) THEN '✅ lats_sales has id column' ELSE '❌ lats_sales missing id column' END as result
UNION ALL
SELECT 'LATS Sales Structure Check', 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'lats_sales' AND column_name = 'sale_number'
       ) THEN '✅ lats_sales has sale_number column' ELSE '❌ lats_sales missing sale_number column' END;

-- 6. Check if there are any constraints or triggers that might be preventing data
SELECT 
    'Constraint Check' as test,
    constraint_name || ' - ' || constraint_type as result
FROM information_schema.table_constraints 
WHERE table_name IN ('lats_sales', 'lats_sale_items')
ORDER BY table_name, constraint_type;

-- 7. Check if there are any triggers on the tables
SELECT 
    'Trigger Check' as test,
    trigger_name || ' - ' || event_manipulation as result
FROM information_schema.triggers 
WHERE event_object_table IN ('lats_sales', 'lats_sale_items')
ORDER BY event_object_table, trigger_name;

-- 8. Check if there are any foreign key relationships
SELECT 
    'Foreign Key Check' as test,
    tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as result
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('lats_sales', 'lats_sale_items')
ORDER BY tc.table_name;

-- 9. Check if there are any RLS policies that might be blocking data
SELECT 
    'RLS Policy Check' as test,
    schemaname || '.' || tablename || ' - ' || policyname || ' (' || permissive || ')' as result
FROM pg_policies 
WHERE tablename IN ('lats_sales', 'lats_sale_items')
ORDER BY tablename, policyname;

-- 10. Test inserting a sample record to see if it works
DO $$
DECLARE
    test_sale_id UUID;
    insert_error TEXT;
BEGIN
    -- Try to insert a test sale
    BEGIN
        INSERT INTO lats_sales (sale_number, total_amount, payment_method, status)
        VALUES ('TEST-001', 100.00, 'cash', 'completed')
        RETURNING id INTO test_sale_id;
        
        RAISE NOTICE '✅ Test sale inserted successfully with ID: %', test_sale_id;
        
        -- Clean up the test record
        DELETE FROM lats_sales WHERE id = test_sale_id;
        RAISE NOTICE '✅ Test sale cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        insert_error := SQLERRM;
        RAISE NOTICE '❌ Test sale insertion failed: %', insert_error;
    END;
END $$;

-- 11. Final summary
SELECT 
    '🎯 ANALYSIS COMPLETE!' as status,
    'Empty tables analysis finished' as details
UNION ALL
SELECT 'Recommendation', 
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales' AND table_schema = 'public')
         THEN 'Consider migrating data from main sales table to lats_sales'
         ELSE 'Tables are empty - this is normal for a new system'
       END;
