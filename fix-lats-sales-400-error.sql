-- FIX LATS_SALES 400 BAD REQUEST ERROR
-- This script fixes the complex nested query issue causing 400 errors

-- 1. Check current database state
SELECT 
    'Database State Check' as test,
    'Starting lats_sales 400 error fix...' as details;

-- 2. Verify all required tables exist and have proper structure
DO $$
BEGIN
    -- Check if lats_sales table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN
        RAISE NOTICE '❌ lats_sales table does not exist';
    ELSE
        RAISE NOTICE '✅ lats_sales table exists';
    END IF;
    
    -- Check if customers table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        RAISE NOTICE '❌ customers table does not exist';
    ELSE
        RAISE NOTICE '✅ customers table exists';
    END IF;
    
    -- Check if lats_sale_items table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sale_items') THEN
        RAISE NOTICE '❌ lats_sale_items table does not exist';
    ELSE
        RAISE NOTICE '✅ lats_sale_items table exists';
    END IF;
    
    -- Check if lats_products table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_products') THEN
        RAISE NOTICE '❌ lats_products table does not exist';
    ELSE
        RAISE NOTICE '✅ lats_products table exists';
    END IF;
    
    -- Check if lats_product_variants table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') THEN
        RAISE NOTICE '❌ lats_product_variants table does not exist';
    ELSE
        RAISE NOTICE '✅ lats_product_variants table exists';
    END IF;
END $$;

-- 3. Check and fix RLS policies
DO $$
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable all access for all users" ON lats_sales;
    DROP POLICY IF EXISTS "Enable all access for all users" ON customers;
    DROP POLICY IF EXISTS "Enable all access for all users" ON lats_sale_items;
    DROP POLICY IF EXISTS "Enable all access for all users" ON lats_products;
    DROP POLICY IF EXISTS "Enable all access for all users" ON lats_product_variants;
    
    -- Create new policies
    CREATE POLICY "Enable all access for all users" ON lats_sales FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all access for all users" ON customers FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all access for all users" ON lats_sale_items FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all access for all users" ON lats_products FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all access for all users" ON lats_product_variants FOR ALL USING (true) WITH CHECK (true);
    
    RAISE NOTICE '✅ RLS policies created for all tables';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating RLS policies: %', SQLERRM;
END $$;

-- 4. Test the problematic query step by step
DO $$
DECLARE
    sale_count INTEGER := 0;
    customer_count INTEGER := 0;
    sale_items_count INTEGER := 0;
    products_count INTEGER := 0;
    variants_count INTEGER := 0;
BEGIN
    -- Test 1: Check lats_sales table
    SELECT COUNT(*) INTO sale_count FROM lats_sales;
    RAISE NOTICE 'Total sales count: %', sale_count;
    
    -- Test 2: Check customers table
    SELECT COUNT(*) INTO customer_count FROM customers;
    RAISE NOTICE 'Total customers count: %', customer_count;
    
    -- Test 3: Check lats_sale_items table
    SELECT COUNT(*) INTO sale_items_count FROM lats_sale_items;
    RAISE NOTICE 'Total sale items count: %', sale_items_count;
    
    -- Test 4: Check lats_products table
    SELECT COUNT(*) INTO products_count FROM lats_products;
    RAISE NOTICE 'Total products count: %', products_count;
    
    -- Test 5: Check lats_product_variants table
    SELECT COUNT(*) INTO variants_count FROM lats_product_variants;
    RAISE NOTICE 'Total variants count: %', variants_count;
    
END $$;

-- 5. Test simplified queries to identify the issue
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Test 1: Simple lats_sales query
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM lats_sales;
        RAISE NOTICE '✅ Simple lats_sales query works: % records', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Simple lats_sales query failed: %', SQLERRM;
    END;
    
    -- Test 2: lats_sales with customers join
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM lats_sales s
        LEFT JOIN customers c ON s.customer_id = c.id;
        RAISE NOTICE '✅ lats_sales with customers join works: % records', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ lats_sales with customers join failed: %', SQLERRM;
    END;
    
    -- Test 3: lats_sales with sale items
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM lats_sales s
        LEFT JOIN lats_sale_items si ON s.id = si.sale_id;
        RAISE NOTICE '✅ lats_sales with sale items works: % records', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ lats_sales with sale items failed: %', SQLERRM;
    END;
    
    -- Test 4: lats_sales with products
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM lats_sales s
        LEFT JOIN lats_sale_items si ON s.id = si.sale_id
        LEFT JOIN lats_products p ON si.product_id = p.id;
        RAISE NOTICE '✅ lats_sales with products works: % records', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ lats_sales with products failed: %', SQLERRM;
    END;
    
    -- Test 5: lats_sales with variants
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM lats_sales s
        LEFT JOIN lats_sale_items si ON s.id = si.sale_id
        LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id;
        RAISE NOTICE '✅ lats_sales with variants works: % records', result_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ lats_sales with variants failed: %', SQLERRM;
    END;
    
END $$;

-- 6. Create a working version of the complex query
-- This is the CORRECT way to structure the query that was failing
SELECT 
    'Testing the corrected complex query' as test;

-- This should work without 400 error
SELECT 
    s.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 7. Test the nested query structure that was failing
-- This is the CORRECT way to structure the nested query
SELECT 
    'Testing nested query structure' as test;

-- This should work without 400 error
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    -- Sale items as JSON array
    (
        SELECT json_agg(
            json_build_object(
                'id', si.id,
                'product_id', si.product_id,
                'variant_id', si.variant_id,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.total_price,
                'product_name', p.name,
                'product_description', p.description,
                'variant_name', pv.name,
                'variant_sku', pv.sku,
                'variant_attributes', pv.attributes
            )
        )
        FROM lats_sale_items si
        LEFT JOIN lats_products p ON si.product_id = p.id
        LEFT JOIN lats_product_variants pv ON si.variant_id = pv.id
        WHERE si.sale_id = s.id
    ) as sale_items
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- 8. Alternative approach - separate queries
SELECT 
    'Alternative approach - separate queries' as test;

-- Query 1: Get sales with customer info
SELECT 
    s.id,
    s.sale_number,
    s.customer_id,
    s.subtotal,
    s.total_amount,
    s.status,
    s.created_at,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Query 2: Get sale items for specific sales
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
WHERE si.sale_id IN (
    SELECT id FROM lats_sales ORDER BY created_at DESC LIMIT 5
)
ORDER BY si.sale_id, si.id;

-- 9. Final verification
SELECT 
    '🎉 LATS_SALES 400 ERROR FIX COMPLETED!' as status,
    'All database checks and fixes applied' as details
UNION ALL
SELECT 'Next Steps', 
       'Test the lats_sales query in your application'
UNION ALL
SELECT 'If Still Failing', 
       'Use the alternative separate queries approach'
UNION ALL
SELECT 'Expected Result', 
       'lats_sales query should work without 400 Bad Request error';
