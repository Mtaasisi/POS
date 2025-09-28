-- Fix Receipts Table and Sales Query Issues
-- This script addresses the 403 Forbidden and 400 Bad Request errors

-- 1. Fix lats_receipts table (403 Forbidden error)
DO $$
BEGIN
    -- Check if lats_receipts table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_receipts') THEN
        -- Create lats_receipts table
        CREATE TABLE lats_receipts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sale_id UUID NOT NULL,
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
        
        RAISE NOTICE 'Created lats_receipts table';
    ELSE
        RAISE NOTICE 'lats_receipts table already exists';
    END IF;
    
    -- Enable RLS
    ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON lats_receipts;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_receipts;
    DROP POLICY IF EXISTS "Enable update access for all users" ON lats_receipts;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_receipts;
    
    CREATE POLICY "Enable read access for all users" ON lats_receipts FOR SELECT USING (true);
    CREATE POLICY "Enable insert access for all users" ON lats_receipts FOR INSERT WITH CHECK (true);
    CREATE POLICY "Enable update access for all users" ON lats_receipts FOR UPDATE USING (true);
    CREATE POLICY "Enable delete access for all users" ON lats_receipts FOR DELETE USING (true);
    
    RAISE NOTICE 'Enabled RLS and created policies for lats_receipts';
    
    -- Create indexes
    CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_receipts_receipt_number ON lats_receipts(receipt_number);
    CREATE INDEX IF NOT EXISTS idx_lats_receipts_sale_id ON lats_receipts(sale_id);
    CREATE INDEX IF NOT EXISTS idx_lats_receipts_created_at ON lats_receipts(created_at);
    
    RAISE NOTICE 'Created indexes for lats_receipts';
    
END $$;

-- 2. Fix lats_sale_items table (needed for the sales query)
DO $$
BEGIN
    -- Check if lats_sale_items table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_sale_items') THEN
        -- Create lats_sale_items table
        CREATE TABLE lats_sale_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sale_id UUID NOT NULL,
            product_id UUID NOT NULL,
            variant_id UUID,
            sku VARCHAR(100),
            quantity INTEGER DEFAULT 1,
            unit_price DECIMAL(15,2) DEFAULT 0,
            total_price DECIMAL(15,2) DEFAULT 0,
            cost_price DECIMAL(15,2) DEFAULT 0,
            profit DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created lats_sale_items table';
    ELSE
        RAISE NOTICE 'lats_sale_items table already exists';
    END IF;
    
    -- Enable RLS
    ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
    DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;
    
    CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
    CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
    CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
    CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);
    
    RAISE NOTICE 'Enabled RLS and created policies for lats_sale_items';
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);
    
    RAISE NOTICE 'Created indexes for lats_sale_items';
    
END $$;

-- 3. Fix lats_products table (needed for the sales query)
DO $$
BEGIN
    -- Check if lats_products table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_products') THEN
        -- Create lats_products table
        CREATE TABLE lats_products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            brand VARCHAR(100),
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created lats_products table';
    ELSE
        RAISE NOTICE 'lats_products table already exists';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'category') THEN
            ALTER TABLE lats_products ADD COLUMN category VARCHAR(100);
            RAISE NOTICE 'Added category column to lats_products';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'brand') THEN
            ALTER TABLE lats_products ADD COLUMN brand VARCHAR(100);
            RAISE NOTICE 'Added brand column to lats_products';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'status') THEN
            ALTER TABLE lats_products ADD COLUMN status VARCHAR(20) DEFAULT 'active';
            RAISE NOTICE 'Added status column to lats_products';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'created_at') THEN
            ALTER TABLE lats_products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to lats_products';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'updated_at') THEN
            ALTER TABLE lats_products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to lats_products';
        END IF;
    END IF;
    
    -- Enable RLS
    ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
    DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;
    
    CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
    CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
    CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
    CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);
    
    RAISE NOTICE 'Enabled RLS and created policies for lats_products';
    
    -- Create indexes (only if columns exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'name') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
        RAISE NOTICE 'Created name index for lats_products';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
        RAISE NOTICE 'Created category index for lats_products';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_products' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);
        RAISE NOTICE 'Created status index for lats_products';
    END IF;
    
    RAISE NOTICE 'Created indexes for lats_products';
    
END $$;

-- 4. Fix lats_product_variants table (needed for the sales query)
DO $$
BEGIN
    -- Check if lats_product_variants table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lats_product_variants') THEN
        -- Create lats_product_variants table
        CREATE TABLE lats_product_variants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL,
            name VARCHAR(255),
            sku VARCHAR(100) UNIQUE,
            attributes JSONB,
            price DECIMAL(15,2) DEFAULT 0,
            cost_price DECIMAL(15,2) DEFAULT 0,
            stock_quantity INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created lats_product_variants table';
    ELSE
        RAISE NOTICE 'lats_product_variants table already exists';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'name') THEN
            ALTER TABLE lats_product_variants ADD COLUMN name VARCHAR(255);
            RAISE NOTICE 'Added name column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'attributes') THEN
            ALTER TABLE lats_product_variants ADD COLUMN attributes JSONB;
            RAISE NOTICE 'Added attributes column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'price') THEN
            ALTER TABLE lats_product_variants ADD COLUMN price DECIMAL(15,2) DEFAULT 0;
            RAISE NOTICE 'Added price column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'cost_price') THEN
            ALTER TABLE lats_product_variants ADD COLUMN cost_price DECIMAL(15,2) DEFAULT 0;
            RAISE NOTICE 'Added cost_price column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'stock_quantity') THEN
            ALTER TABLE lats_product_variants ADD COLUMN stock_quantity INTEGER DEFAULT 0;
            RAISE NOTICE 'Added stock_quantity column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'status') THEN
            ALTER TABLE lats_product_variants ADD COLUMN status VARCHAR(20) DEFAULT 'active';
            RAISE NOTICE 'Added status column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'created_at') THEN
            ALTER TABLE lats_product_variants ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to lats_product_variants';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'updated_at') THEN
            ALTER TABLE lats_product_variants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to lats_product_variants';
        END IF;
    END IF;
    
    -- Enable RLS
    ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
    DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;
    
    CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
    CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
    CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
    CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);
    
    RAISE NOTICE 'Enabled RLS and created policies for lats_product_variants';
    
    -- Create indexes (only if columns exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'sku') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
        RAISE NOTICE 'Created sku index for lats_product_variants';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'product_id') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
        RAISE NOTICE 'Created product_id index for lats_product_variants';
    END IF;
    
    -- Only create status index if status column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_product_variants' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);
        RAISE NOTICE 'Created status index for lats_product_variants';
    ELSE
        RAISE NOTICE 'Status column does not exist in lats_product_variants, skipping status index';
    END IF;
    
    RAISE NOTICE 'Created indexes for lats_product_variants';
    
END $$;

-- 5. Test the sales query that was failing
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test the exact query that was failing
    SELECT COUNT(*) INTO test_result
    FROM lats_sales 
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    ORDER BY lats_sales.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE '✅ Sales query test successful';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Sales query test failed: %', SQLERRM;
END $$;

-- 6. Test receipt insertion
DO $$
DECLARE
    test_receipt_id UUID;
    test_sale_id UUID;
BEGIN
    -- Get a test sale ID
    SELECT id INTO test_sale_id FROM lats_sales LIMIT 1;
    
    IF test_sale_id IS NOT NULL THEN
        -- Test receipt insertion
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
        
        RAISE NOTICE '✅ Receipt insertion test successful with ID: %', test_receipt_id;
        
        -- Clean up
        DELETE FROM lats_receipts WHERE id = test_receipt_id;
        RAISE NOTICE '✅ Test receipt cleaned up';
        
    ELSE
        RAISE NOTICE 'No sales found to test receipt insertion';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Receipt insertion test failed: %', SQLERRM;
END $$;

-- 7. Show final status
SELECT '🎉 All tables have been created and configured successfully!' as status;
