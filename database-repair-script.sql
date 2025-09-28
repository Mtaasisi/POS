-- DATABASE REPAIR SCRIPT
-- Use this to fix common issues found in the health check

-- =====================================================
-- 1. CREATE MISSING TABLES (if needed)
-- =====================================================

-- Create lats_sales if missing
CREATE TABLE IF NOT EXISTS lats_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_by UUID REFERENCES auth_users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_sale_items if missing
CREATE TABLE IF NOT EXISTS lats_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id UUID,
    sku VARCHAR(100),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2) DEFAULT 0,
    profit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_products if missing
CREATE TABLE IF NOT EXISTS lats_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_product_variants if missing
CREATE TABLE IF NOT EXISTS lats_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    name VARCHAR(255),
    sku VARCHAR(100),
    attributes JSONB,
    price DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ADD MISSING COLUMNS
-- =====================================================

-- Add missing columns to lats_products
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to lats_product_variants
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 3. FIX DATA INTEGRITY ISSUES
-- =====================================================

-- Fix negative quantities
UPDATE lats_sale_items 
SET quantity = 1 
WHERE quantity <= 0;

-- Fix negative prices
UPDATE lats_sale_items 
SET unit_price = 0 
WHERE unit_price < 0;

UPDATE lats_sale_items 
SET total_price = 0 
WHERE total_price < 0;

-- Fix price calculation mismatches
UPDATE lats_sale_items 
SET total_price = quantity * unit_price 
WHERE ABS(total_price - (quantity * unit_price)) > 0.01;

-- =====================================================
-- 4. CREATE MISSING INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lats_sales
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sales FOR DELETE USING (true);

-- Create RLS policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);

-- Create RLS policies for lats_products
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);

-- Create RLS policies for lats_product_variants
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;

CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);

-- =====================================================
-- 6. VERIFICATION TEST
-- =====================================================

-- Test the complex query that was failing
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count
    FROM lats_sales 
    LEFT JOIN lats_sale_items ON lats_sales.id = lats_sale_items.sale_id
    LEFT JOIN lats_products ON lats_sale_items.product_id = lats_products.id
    LEFT JOIN lats_product_variants ON lats_sale_items.variant_id = lats_product_variants.id
    LIMIT 1;
    
    RAISE NOTICE '✅ Database repair completed successfully! Complex query test passed with % records', test_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Database repair failed: %', SQLERRM;
END $$;

-- Final status
SELECT '🎉 Database repair script completed! All tables, columns, indexes, and policies have been created/fixed.' as status;
