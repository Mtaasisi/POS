-- Migration: Fix foreign key constraints for lats_sale_items table
-- This ensures proper relationships between lats_sale_items and related tables

DO $$
BEGIN
    -- Step 1: Add foreign key constraint for lats_sale_items.product_id -> lats_products.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sale_items_product_id_fkey'
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items
        ADD CONSTRAINT lats_sale_items_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: lats_sale_items.product_id -> lats_products.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sale_items_product_id_fkey already exists';
    END IF;

    -- Step 2: Add foreign key constraint for lats_sale_items.variant_id -> lats_product_variants.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sale_items_variant_id_fkey'
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items
        ADD CONSTRAINT lats_sale_items_variant_id_fkey
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: lats_sale_items.variant_id -> lats_product_variants.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sale_items_variant_id_fkey already exists';
    END IF;

    -- Step 3: Add foreign key constraint for lats_sale_items.sale_id -> lats_sales.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sale_items_sale_id_fkey'
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items
        ADD CONSTRAINT lats_sale_items_sale_id_fkey
        FOREIGN KEY (sale_id) REFERENCES lats_sales(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added foreign key constraint: lats_sale_items.sale_id -> lats_sales.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sale_items_sale_id_fkey already exists';
    END IF;

    -- Step 4: Ensure RLS policies are properly set up
    ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all access for all users on lats_sale_items" ON lats_sale_items;
    DROP POLICY IF EXISTS "Allow authenticated users to manage sale items" ON lats_sale_items;
    DROP POLICY IF EXISTS "Allow all operations on sale items" ON lats_sale_items;
    
    -- Create new comprehensive policy
    CREATE POLICY "Enable all access for all users on lats_sale_items"
    ON lats_sale_items FOR ALL USING (true);
    
    RAISE NOTICE '✅ RLS policies updated for lats_sale_items table';

    -- Step 5: Grant necessary permissions
    GRANT ALL ON lats_sale_items TO authenticated;
    GRANT ALL ON lats_sale_items TO anon;
    GRANT ALL ON lats_sale_items TO service_role;
    
    RAISE NOTICE '✅ Permissions granted for lats_sale_items table';

    -- Step 6: Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale ON lats_sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product ON lats_sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant ON lats_sale_items(variant_id);
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_created_at ON lats_sale_items(created_at);
    
    RAISE NOTICE '✅ Indexes created for lats_sale_items table';

END $$;

-- Verify the constraints exist
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'lats_sale_items' 
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;
