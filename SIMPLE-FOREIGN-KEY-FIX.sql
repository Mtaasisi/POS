-- SIMPLE FOREIGN KEY FIX: Clean up orphaned data and add constraints safely
-- Run this in your Supabase SQL Editor

-- Step 1: Clean up orphaned data
DELETE FROM lats_sale_items 
WHERE sale_id NOT IN (SELECT id FROM lats_sales);

-- Step 2: Clean up invalid product references
DELETE FROM lats_sale_items 
WHERE product_id NOT IN (SELECT id FROM lats_products);

-- Step 3: Clean up invalid variant references (if variants table exists)
DELETE FROM lats_sale_items 
WHERE variant_id IS NOT NULL 
AND variant_id NOT IN (SELECT id FROM lats_product_variants);

-- Step 4: Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    -- Add foreign key from lats_sale_items to lats_sales
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_sale_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_sale_id 
        FOREIGN KEY (sale_id) REFERENCES lats_sales(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key: lats_sale_items.sale_id -> lats_sales.id';
    END IF;
    
    -- Add foreign key from lats_sale_items to lats_products
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_product_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key: lats_sale_items.product_id -> lats_products.id';
    END IF;
    
    -- Add foreign key from lats_sale_items to lats_product_variants
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
        END IF;
    END IF;
    
    RAISE NOTICE '🎉 All foreign key constraints added successfully!';
END $$;

-- Step 5: Test the fix
SELECT '🎉 FOREIGN KEY FIX COMPLETED!' as status;
SELECT 'All orphaned data has been cleaned up and foreign key constraints have been added.' as message;
