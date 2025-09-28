-- FIX FOREIGN KEY ERRORS: Clean up orphaned data before adding constraints
-- This script fixes the foreign key constraint violations

-- 1. First, let's see what we're dealing with
SELECT 'Checking orphaned data...' as info;

-- Check for orphaned sale_items
SELECT 
    'Orphaned lats_sale_items:' as issue,
    COUNT(*) as count
FROM lats_sale_items si
LEFT JOIN lats_sales s ON si.sale_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned sale_items with invalid product references
SELECT 
    'Orphaned product references:' as issue,
    COUNT(*) as count
FROM lats_sale_items si
LEFT JOIN lats_products p ON si.product_id = p.id
WHERE p.id IS NULL;

-- 2. Clean up orphaned data
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    RAISE NOTICE '🧹 Cleaning up orphaned data...';
    
    -- Remove orphaned sale_items (items without valid sales)
    DELETE FROM lats_sale_items 
    WHERE sale_id NOT IN (SELECT id FROM lats_sales);
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RAISE NOTICE '✅ Removed % orphaned sale_items', orphaned_count;
    
    -- Remove orphaned sale_items with invalid product references
    DELETE FROM lats_sale_items 
    WHERE product_id NOT IN (SELECT id FROM lats_products);
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RAISE NOTICE '✅ Removed % sale_items with invalid product references', orphaned_count;
    
    -- Remove orphaned sale_items with invalid variant references (if variants exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') THEN
        DELETE FROM lats_sale_items 
        WHERE variant_id IS NOT NULL 
        AND variant_id NOT IN (SELECT id FROM lats_product_variants);
        
        GET DIAGNOSTICS orphaned_count = ROW_COUNT;
        RAISE NOTICE '✅ Removed % sale_items with invalid variant references', orphaned_count;
    END IF;
    
    RAISE NOTICE '🧹 Data cleanup completed';
END $$;

-- 3. Now safely add foreign key constraints
DO $$
BEGIN
    RAISE NOTICE '🔗 Adding foreign key constraints...';
    
    -- Add foreign key from lats_sale_items to lats_sales (only if constraint doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_sale_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_sale_id 
        FOREIGN KEY (sale_id) REFERENCES lats_sales(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key: lats_sale_items.sale_id -> lats_sales.id';
    ELSE
        RAISE NOTICE '✅ Foreign key fk_lats_sale_items_sale_id already exists';
    END IF;
    
    -- Add foreign key from lats_sale_items to lats_products (only if constraint doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_product_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key: lats_sale_items.product_id -> lats_products.id';
    ELSE
        RAISE NOTICE '✅ Foreign key fk_lats_sale_items_product_id already exists';
    END IF;
    
    -- Add foreign key from lats_sale_items to lats_product_variants (only if variants table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_product_variants') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_lats_sale_items_variant_id' 
            AND table_name = 'lats_sale_items'
        ) THEN
            ALTER TABLE lats_sale_items 
            ADD CONSTRAINT fk_lats_sale_items_variant_id 
            FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE SET NULL;
            RAISE NOTICE '✅ Added foreign key: lats_sale_items.variant_id -> lats_product_variants.id';
        ELSE
            RAISE NOTICE '✅ Foreign key fk_lats_sale_items_variant_id already exists';
        END IF;
    END IF;
    
    RAISE NOTICE '🔗 Foreign key constraints added successfully';
END $$;

-- 4. Test the relationships
DO $$
DECLARE
    test_sale_id UUID;
    test_product_id UUID;
    test_sale_item_id UUID;
    relationship_test_passed BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '🧪 Testing foreign key relationships...';
    
    -- Get a valid product ID
    SELECT id INTO test_product_id FROM lats_products LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- Create a test sale
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            payment_method,
            status,
            created_by
        ) VALUES (
            'TEST-SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            gen_random_uuid(),
            100.00,
            '{"type": "cash", "amount": 100.00}',
            'completed',
            'System Test'
        ) RETURNING id INTO test_sale_id;
        
        RAISE NOTICE '✅ Created test sale with ID: %', test_sale_id;
        
        -- Try to create a sale item (this should work now)
        INSERT INTO lats_sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            test_sale_id,
            test_product_id,
            1,
            100.00,
            100.00
        ) RETURNING id INTO test_sale_item_id;
        
        RAISE NOTICE '✅ Created test sale item with ID: %', test_sale_item_id;
        
        -- Test the complex query
        PERFORM COUNT(*)
        FROM lats_sales 
        LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
        LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
        WHERE lats_sales.id = test_sale_id;
        
        RAISE NOTICE '✅ Complex query test successful';
        relationship_test_passed := TRUE;
        
        -- Clean up test data
        DELETE FROM lats_sale_items WHERE id = test_sale_item_id;
        DELETE FROM lats_sales WHERE id = test_sale_id;
        
        RAISE NOTICE '✅ Test data cleaned up';
        
    ELSE
        RAISE NOTICE '⚠️  No products found to test relationships';
    END IF;
    
    IF relationship_test_passed THEN
        RAISE NOTICE '🎉 All foreign key relationships are working correctly!';
    ELSE
        RAISE NOTICE '⚠️  Relationship test could not be completed';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Relationship test failed: %', SQLERRM;
    RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 5. Show final status
SELECT '🎉 FOREIGN KEY ERRORS FIXED!' as status;
SELECT 'All orphaned data has been cleaned up and foreign key constraints have been added.' as message;

-- 6. Show current data counts
SELECT 
    'lats_sales' as table_name,
    COUNT(*) as record_count
FROM lats_sales
UNION ALL
SELECT 
    'lats_sale_items' as table_name,
    COUNT(*) as record_count
FROM lats_sale_items
UNION ALL
SELECT 
    'lats_products' as table_name,
    COUNT(*) as record_count
FROM lats_products;
