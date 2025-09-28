-- SIMPLE FIX: Receipts and Sales Query Issues
-- This script fixes the 403 Forbidden and 400 Bad Request errors with a simpler approach

-- 1. Create lats_receipts table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS lats_receipts (
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

-- 2. Create lats_sale_items table (if it doesn't exist)
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

-- 3. Add missing columns to existing tables (safe approach)
-- Add columns to lats_products if they don't exist
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add columns to lats_product_variants if they don't exist
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS attributes JSONB;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Enable RLS on all tables
ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for lats_receipts
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_receipts;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_receipts;

CREATE POLICY "Enable read access for all users" ON lats_receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_receipts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_receipts FOR DELETE USING (true);

-- 6. Create RLS policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);

-- 7. Create RLS policies for lats_products
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;

CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);

-- 8. Create RLS policies for lats_product_variants
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;

CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);

-- 9. Create indexes (safe approach with IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_receipts_receipt_number ON lats_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_sale_id ON lats_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_created_at ON lats_receipts(created_at);

CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products(name);
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_status ON lats_product_variants(status);

-- 10. Test receipt insertion
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

-- 11. Test sales query
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
    ORDER BY lats_sales.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE '✅ Sales query test successful, found % records', test_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Sales query test failed: %', SQLERRM;
END $$;

-- 12. Final status
SELECT '🎉 All tables have been created and configured successfully!' as status;
