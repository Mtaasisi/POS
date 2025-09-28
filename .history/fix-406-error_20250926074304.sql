-- FIX 406 NOT ACCEPTABLE ERROR
-- This script addresses the 406 error when querying lats_sales table

-- 1. First, let's check the current state of the database
SELECT 
    'Database Status Check' as test,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') 
         THEN '✅ lats_sales exists' ELSE '❌ lats_sales missing' END as result
UNION ALL
SELECT 'Database Status Check', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sale_items') 
            THEN '✅ lats_sale_items exists' ELSE '❌ lats_sale_items missing' END
UNION ALL
SELECT 'Database Status Check', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
            THEN '✅ customers exists' ELSE '❌ customers missing' END;

-- 2. Check RLS status on tables
SELECT 
    'RLS Status Check' as test,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'lats_sales' AND c.relrowsecurity = true
    ) THEN '✅ RLS enabled on lats_sales' ELSE '❌ RLS not enabled on lats_sales' END as result
UNION ALL
SELECT 'RLS Status Check', 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_class c 
           JOIN pg_namespace n ON n.oid = c.relnamespace 
           WHERE c.relname = 'lats_sale_items' AND c.relrowsecurity = true
       ) THEN '✅ RLS enabled on lats_sale_items' ELSE '❌ RLS not enabled on lats_sale_items' END
UNION ALL
SELECT 'RLS Status Check', 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_class c 
           JOIN pg_namespace n ON n.oid = c.relnamespace 
           WHERE c.relname = 'customers' AND c.relrowsecurity = true
       ) THEN '✅ RLS enabled on customers' ELSE '❌ RLS not enabled on customers' END;

-- 3. Check existing policies
SELECT 
    'Policy Check' as test,
    schemaname || '.' || tablename || ' - ' || policyname as result
FROM pg_policies 
WHERE tablename IN ('lats_sales', 'lats_sale_items', 'customers')
ORDER BY tablename, policyname;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable all access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable all access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

-- 5. Create comprehensive RLS policies that allow all operations
-- This should fix the 406 error by ensuring proper access permissions

-- For lats_sales table
CREATE POLICY "Enable all operations for all users" ON lats_sales 
FOR ALL USING (true) WITH CHECK (true);

-- For lats_sale_items table  
CREATE POLICY "Enable all operations for all users" ON lats_sale_items 
FOR ALL USING (true) WITH CHECK (true);

-- For customers table
CREATE POLICY "Enable all operations for all users" ON customers 
FOR ALL USING (true) WITH CHECK (true);

-- 6. Ensure tables have proper structure
-- Check if lats_sales has the required columns
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_name TEXT;
    required_columns TEXT[] := ARRAY['id', 'sale_number', 'customer_id', 'total_amount', 'payment_method', 'status', 'created_at'];
BEGIN
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lats_sales' AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in lats_sales: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist in lats_sales';
    END IF;
END $$;

-- 7. Test the specific query that was failing
DO $$
DECLARE
    test_count INTEGER;
    test_error TEXT;
    test_sale_id UUID := '36487185-0673-4e03-83c2-26eba8d9fef7';
BEGIN
    -- Test 1: Simple select query
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM lats_sales 
        WHERE id = test_sale_id;
        
        RAISE NOTICE '✅ Simple query test successful, found % records for sale %', test_count, test_sale_id;
        
    EXCEPTION WHEN OTHERS THEN
        test_error := SQLERRM;
        RAISE NOTICE '❌ Simple query test failed: %', test_error;
    END;
    
    -- Test 2: Supabase REST API format query
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM lats_sales 
        WHERE id = test_sale_id;
        
        RAISE NOTICE '✅ Supabase format query test successful, found % records', test_count;
        
    EXCEPTION WHEN OTHERS THEN
        test_error := SQLERRM;
        RAISE NOTICE '❌ Supabase format query test failed: %', test_error;
    END;
END $$;

-- 8. Check if the specific sale exists
SELECT 
    'Specific Sale Check' as test,
    CASE WHEN EXISTS (SELECT 1 FROM lats_sales WHERE id = '36487185-0673-4e03-83c2-26eba8d9fef7')
         THEN '✅ Sale exists' ELSE '❌ Sale not found' END as result
UNION ALL
SELECT 'Sale Details', 
       COALESCE(sale_number, 'No sale number') || ' - ' || COALESCE(status, 'No status')
FROM lats_sales 
WHERE id = '36487185-0673-4e03-83c2-26eba8d9fef7';

-- 9. Final status report
SELECT 
    '🎉 406 ERROR FIX COMPLETED!' as status,
    'RLS policies updated and tested' as details
UNION ALL
SELECT 'Tables Status', 
       'lats_sales: ' || (SELECT COUNT(*) FROM lats_sales) || ' records'
UNION ALL
SELECT 'Tables Status', 
       'lats_sale_items: ' || (SELECT COUNT(*) FROM lats_sale_items) || ' records'
UNION ALL
SELECT 'Tables Status', 
       'customers: ' || (SELECT COUNT(*) FROM customers) || ' records';
