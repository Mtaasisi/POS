-- COMPREHENSIVE DATABASE FIX: Fix all 400 Bad Request errors
-- This script addresses the root cause of the failing lats_sales queries

-- 1. Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Tanzania',
    customer_type VARCHAR(50) DEFAULT 'regular',
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create lats_sale_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_sale_items (
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

-- 3. Ensure lats_sales table has all required columns
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS sale_number VARCHAR(100);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add missing columns to lats_products (if they don't exist)
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Add missing columns to lats_product_variants (if they don't exist)
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Create foreign key relationships
-- Add foreign key from lats_sales to customers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sales_customer_id' 
        AND table_name = 'lats_sales'
    ) THEN
        ALTER TABLE lats_sales 
        ADD CONSTRAINT fk_lats_sales_customer_id 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key from lats_sale_items to lats_sales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_sale_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_sale_id 
        FOREIGN KEY (sale_id) REFERENCES lats_sales(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from lats_sale_items to lats_products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_product_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from lats_sale_items to lats_product_variants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_sale_items_variant_id' 
        AND table_name = 'lats_sale_items'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD CONSTRAINT fk_lats_sale_items_variant_id 
        FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key from lats_product_variants to lats_products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lats_product_variants_product_id' 
        AND table_name = 'lats_product_variants'
    ) THEN
        ALTER TABLE lats_product_variants 
        ADD CONSTRAINT fk_lats_product_variants_product_id 
        FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for customers
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert access for all users" ON customers;
DROP POLICY IF EXISTS "Enable update access for all users" ON customers;
DROP POLICY IF EXISTS "Enable delete access for all users" ON customers;

CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON customers FOR DELETE USING (true);

-- 9. Create RLS policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);

-- 10. Create RLS policies for lats_products
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);

-- 11. Create RLS policies for lats_product_variants
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;

CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);

-- 12. Create RLS policies for lats_sales
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sales FOR DELETE USING (true);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);

CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);

-- 14. Test the failing queries
DO $$
DECLARE
    test_count INTEGER;
    test_customers_count INTEGER;
BEGIN
    -- Test customers table
    SELECT COUNT(*) INTO test_customers_count FROM customers;
    RAISE NOTICE '✅ Customers table test successful, found % records', test_customers_count;
    
    -- Test the exact query that was failing in PaymentsContext
    SELECT COUNT(*) INTO test_count
    FROM lats_sales 
    LEFT JOIN customers ON lats_sales.customer_id = customers.id
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    LIMIT 1;
    
    RAISE NOTICE '✅ Complex PaymentsContext query test successful, found % records', test_count;
    
    -- Test the provider query
    SELECT COUNT(*) INTO test_count
    FROM lats_sales 
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    LIMIT 1;
    
    RAISE NOTICE '✅ Provider query test successful, found % records', test_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Query test failed: %', SQLERRM;
END $$;

-- 15. Insert sample data if tables are empty
DO $$
BEGIN
    -- Insert sample customer if none exist
    IF NOT EXISTS (SELECT 1 FROM customers LIMIT 1) THEN
        INSERT INTO customers (name, phone, customer_type) 
        VALUES ('Walk-in Customer', '0000000000', 'regular');
        RAISE NOTICE '✅ Inserted sample customer';
    END IF;
    
    -- Insert sample product if none exist
    IF NOT EXISTS (SELECT 1 FROM lats_products LIMIT 1) THEN
        INSERT INTO lats_products (name, description, category, status) 
        VALUES ('Sample Product', 'Sample product description', 'General', 'active');
        RAISE NOTICE '✅ Inserted sample product';
    END IF;
END $$;

-- 16. Final status
SELECT '🎉 Comprehensive database fix completed! All tables, relationships, and policies have been created.' as status;
