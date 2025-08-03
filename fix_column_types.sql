-- Fix Column Types for Foreign Key Relationships
-- Run this FIRST in your Supabase SQL Editor

-- 1. Check current column types
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('products', 'inventory_categories', 'suppliers', 'product_variants')
AND column_name IN ('id', 'category_id', 'supplier_id', 'product_id')
ORDER BY table_name, column_name;

-- 2. Fix category_id in products table (convert text to uuid)
ALTER TABLE products 
ALTER COLUMN category_id TYPE uuid USING category_id::uuid;

-- 3. Fix supplier_id in products table (convert text to uuid if needed)
ALTER TABLE products 
ALTER COLUMN supplier_id TYPE uuid USING supplier_id::uuid;

-- 4. Fix product_id in product_variants table (convert text to uuid if needed)
ALTER TABLE product_variants 
ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

-- 5. Now add the foreign key constraints
ALTER TABLE products ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES inventory_categories(id);

ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 6. Add indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- 7. Test the fix
SELECT 'Column types fixed and foreign keys added!' as status; 