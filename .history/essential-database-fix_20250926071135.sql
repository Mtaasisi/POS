-- ESSENTIAL DATABASE FIX: Create missing tables and columns
-- This script creates the minimum required tables to fix 400 Bad Request errors

-- 1. Create lats_sale_items table (if it doesn't exist)
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

-- 2. Add missing columns to lats_products (if they don't exist)
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add missing columns to lats_product_variants (if they don't exist)
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Enable RLS on all tables
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);

-- 6. Create RLS policies for lats_products
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);

-- 7. Create RLS policies for lats_product_variants
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;

CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);

-- 9. Test the failing query
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Test the exact query that was failing
    SELECT COUNT(*) INTO test_count
    FROM lats_sales 
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    LIMIT 1;
    
    RAISE NOTICE '✅ Complex query test successful, found % records', test_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Complex query test failed: %', SQLERRM;
END $$;

-- 10. Final status
SELECT '🎉 Essential database fix completed! All required tables and columns have been created.' as status;
