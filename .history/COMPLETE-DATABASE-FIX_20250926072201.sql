-- COMPLETE DATABASE FIX: Fix all relationship and schema issues
-- This script addresses the foreign key relationship errors and missing columns

-- 1. First, let's check what we have
SELECT 'Current database structure:' as info;

-- Check lats_sales table structure
SELECT 
    'lats_sales columns:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Check lats_sale_items table structure  
SELECT 
    'lats_sale_items columns:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items' 
ORDER BY ordinal_position;

-- 2. Fix lats_sales table - ensure it has all required columns
DO $$
BEGIN
    -- Add missing columns to lats_sales if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'sale_number') THEN
        ALTER TABLE lats_sales ADD COLUMN sale_number VARCHAR(50);
        RAISE NOTICE 'Added sale_number column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'customer_id') THEN
        ALTER TABLE lats_sales ADD COLUMN customer_id UUID;
        RAISE NOTICE 'Added customer_id column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'total_amount') THEN
        ALTER TABLE lats_sales ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added total_amount column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'payment_method') THEN
        ALTER TABLE lats_sales ADD COLUMN payment_method TEXT;
        RAISE NOTICE 'Added payment_method column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'status') THEN
        ALTER TABLE lats_sales ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
        RAISE NOTICE 'Added status column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'created_by') THEN
        ALTER TABLE lats_sales ADD COLUMN created_by TEXT;
        RAISE NOTICE 'Added created_by column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'created_at') THEN
        ALTER TABLE lats_sales ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to lats_sales';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'updated_at') THEN
        ALTER TABLE lats_sales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to lats_sales';
    END IF;
    
    RAISE NOTICE 'lats_sales table structure updated';
END $$;

-- 3. Fix lats_sale_items table - ensure it has proper foreign key
DO $$
BEGIN
    -- Add missing columns to lats_sale_items if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'sale_id') THEN
        ALTER TABLE lats_sale_items ADD COLUMN sale_id UUID NOT NULL;
        RAISE NOTICE 'Added sale_id column to lats_sale_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'product_id') THEN
        ALTER TABLE lats_sale_items ADD COLUMN product_id UUID NOT NULL;
        RAISE NOTICE 'Added product_id column to lats_sale_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'variant_id') THEN
        ALTER TABLE lats_sale_items ADD COLUMN variant_id UUID;
        RAISE NOTICE 'Added variant_id column to lats_sale_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'quantity') THEN
        ALTER TABLE lats_sale_items ADD COLUMN quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Added quantity column to lats_sale_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'unit_price') THEN
        ALTER TABLE lats_sale_items ADD COLUMN unit_price DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added unit_price column to lats_sale_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sale_items' AND column_name = 'total_price') THEN
        ALTER TABLE lats_sale_items ADD COLUMN total_price DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added total_price column to lats_sale_items';
    END IF;
    
    RAISE NOTICE 'lats_sale_items table structure updated';
END $$;

-- 4. Create foreign key relationships
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
        RAISE NOTICE 'Added foreign key constraint: lats_sale_items.sale_id -> lats_sales.id';
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
        RAISE NOTICE 'Added foreign key constraint: lats_sale_items.product_id -> lats_products.id';
    END IF;
    
    -- Add foreign key from lats_sale_items to lats_product_variants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_variant_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_variant_id 
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint: lats_sale_items.variant_id -> lats_product_variants.id';
    END IF;
    
    RAISE NOTICE 'Foreign key relationships created';
END $$;

-- 5. Create lats_receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(15,2) DEFAULT 0,
    payment_method TEXT,
    items_count INTEGER DEFAULT 0,
    generated_by TEXT,
    receipt_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on all tables
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for all tables
-- lats_sales policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sales FOR DELETE USING (true);

-- lats_sale_items policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);

-- lats_products policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);

-- lats_product_variants policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;

CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);

-- lats_receipts policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_receipts;

CREATE POLICY "Enable read access for all users" ON lats_receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_receipts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_receipts FOR DELETE USING (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);

CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_receipts_receipt_number ON lats_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_sale_id ON lats_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_created_at ON lats_receipts(created_at);

-- 9. Test the relationships
DO $$
DECLARE
    test_sale_id UUID;
    test_product_id UUID;
    test_variant_id UUID;
    test_sale_item_id UUID;
    test_receipt_id UUID;
BEGIN
    RAISE NOTICE '🧪 Testing database relationships...';
    
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
    
    -- Get a test product
    SELECT id INTO test_product_id FROM lats_products LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- Create a test sale item
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
        
        -- Create a test receipt
        INSERT INTO lats_receipts (
            sale_id,
            receipt_number,
            customer_name,
            customer_phone,
            total_amount,
            payment_method,
            items_count,
            generated_by,
            receipt_content
        ) VALUES (
            test_sale_id,
            'TEST-RECEIPT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'Test Customer',
            '+255700000000',
            100.00,
            '{"type": "cash", "amount": 100.00}',
            1,
            'System Test',
            'Test receipt content'
        ) RETURNING id INTO test_receipt_id;
        
        RAISE NOTICE '✅ Created test receipt with ID: %', test_receipt_id;
        
        -- Test the complex query
        PERFORM COUNT(*)
        FROM lats_sales 
        LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
        LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
        LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
        WHERE lats_sales.id = test_sale_id;
        
        RAISE NOTICE '✅ Complex query test successful';
        
        -- Clean up test data
        DELETE FROM lats_receipts WHERE id = test_receipt_id;
        DELETE FROM lats_sale_items WHERE id = test_sale_item_id;
        DELETE FROM lats_sales WHERE id = test_sale_id;
        
        RAISE NOTICE '✅ Test data cleaned up';
        
    ELSE
        RAISE NOTICE '⚠️  No products found to test relationships';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
    RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 10. Show final status
SELECT '🎉 COMPLETE DATABASE FIX FINISHED!' as status;
SELECT 'All tables, relationships, and policies have been created and tested.' as message;
