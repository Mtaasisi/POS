-- Complete Database Fix for Products Table Issues
-- Run this in your Supabase SQL Editor

-- Step 1: Check what we have
SELECT 'Current table structure:' as info;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('products', 'inventory_categories', 'suppliers', 'product_variants')
ORDER BY table_name, ordinal_position;

-- Step 2: Drop existing constraints if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_category') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_category;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_supplier') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_supplier;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_variants_product') THEN
        ALTER TABLE product_variants DROP CONSTRAINT fk_variants_product;
    END IF;
END $$;

-- Step 3: Ensure the products table has the right structure
-- First, let's see what columns exist
SELECT 'Products table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products';

-- Step 4: Fix column types if needed
DO $$
BEGIN
    -- First, handle empty strings by setting them to NULL
    UPDATE products SET category_id = NULL WHERE category_id = '' OR category_id IS NULL;
    UPDATE products SET supplier_id = NULL WHERE supplier_id = '' OR supplier_id IS NULL;
    UPDATE product_variants SET product_id = NULL WHERE product_id = '' OR product_id IS NULL;
    
    RAISE NOTICE 'Cleaned up empty string values';
    
    -- Convert category_id to uuid if it's text
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'category_id' 
               AND data_type = 'text') THEN
        ALTER TABLE products ALTER COLUMN category_id TYPE uuid USING 
            CASE WHEN category_id IS NULL OR category_id = '' THEN NULL 
                 ELSE category_id::uuid END;
        RAISE NOTICE 'Converted category_id to uuid';
    END IF;
    
    -- Convert supplier_id to uuid if it's text
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'supplier_id' 
               AND data_type = 'text') THEN
        ALTER TABLE products ALTER COLUMN supplier_id TYPE uuid USING 
            CASE WHEN supplier_id IS NULL OR supplier_id = '' THEN NULL 
                 ELSE supplier_id::uuid END;
        RAISE NOTICE 'Converted supplier_id to uuid';
    END IF;
    
    -- Convert product_id to uuid if it's text
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'product_variants' AND column_name = 'product_id' 
               AND data_type = 'text') THEN
        ALTER TABLE product_variants ALTER COLUMN product_id TYPE uuid USING 
            CASE WHEN product_id IS NULL OR product_id = '' THEN NULL 
                 ELSE product_id::uuid END;
        RAISE NOTICE 'Converted product_id to uuid';
    END IF;
END $$;

-- Step 5: Add foreign key constraints
ALTER TABLE products ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES inventory_categories(id);

ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Step 7: Add sample data if tables are empty
INSERT INTO inventory_categories (name, description, color) VALUES 
('Electronics', 'Electronic components and devices', '#3B82F6'),
('Accessories', 'Phone and device accessories', '#10B981'),
('Parts', 'Replacement parts and components', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_person, email, phone, city) VALUES 
('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700000001', 'Nairobi'),
('Mobile Parts Co', 'Jane Smith', 'jane@mobileparts.co.ke', '+254700000002', 'Mombasa'),
('Electronics Hub', 'Mike Johnson', 'mike@electronicshub.com', '+254700000003', 'Nakuru')
ON CONFLICT (name) DO NOTHING;

-- Step 8: Test the relationships
SELECT 'Testing foreign key relationships:' as info;
SELECT 
    p.name as product_name,
    c.name as category_name,
    s.name as supplier_name
FROM products p
LEFT JOIN inventory_categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LIMIT 5;

-- Step 9: Final verification
SELECT 'Foreign key constraints created:' as info;
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('products', 'product_variants');

SELECT 'Fix completed successfully!' as status; 