-- Simple Fix for Products Table Issues
-- Run this in your Supabase SQL Editor

-- Step 1: Clean up empty values
UPDATE products SET category_id = NULL WHERE category_id = '' OR category_id IS NULL;
UPDATE products SET supplier_id = NULL WHERE supplier_id = '' OR supplier_id IS NULL;
UPDATE product_variants SET product_id = NULL WHERE product_id = '' OR product_id IS NULL;

-- Step 2: Convert column types safely
ALTER TABLE products ALTER COLUMN category_id TYPE uuid USING 
    CASE WHEN category_id IS NULL OR category_id = '' THEN NULL 
         ELSE category_id::uuid END;

ALTER TABLE products ALTER COLUMN supplier_id TYPE uuid USING 
    CASE WHEN supplier_id IS NULL OR supplier_id = '' THEN NULL 
         ELSE supplier_id::uuid END;

ALTER TABLE product_variants ALTER COLUMN product_id TYPE uuid USING 
    CASE WHEN product_id IS NULL OR product_id = '' THEN NULL 
         ELSE product_id::uuid END;

-- Step 3: Add foreign key constraints
ALTER TABLE products ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES inventory_categories(id);

ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Step 4: Add indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Step 5: Add sample data
INSERT INTO inventory_categories (name, description, color) VALUES 
('Electronics', 'Electronic components and devices', '#3B82F6'),
('Accessories', 'Phone and device accessories', '#10B981'),
('Parts', 'Replacement parts and components', '#F59E0B');

INSERT INTO suppliers (name, contact_person, email, phone, city) VALUES 
('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700000001', 'Nairobi'),
('Mobile Parts Co', 'Jane Smith', 'jane@mobileparts.co.ke', '+254700000002', 'Mombasa'),
('Electronics Hub', 'Mike Johnson', 'mike@electronicshub.com', '+254700000003', 'Nakuru');

-- Step 6: Test the fix
SELECT 'Foreign keys added successfully!' as status; 