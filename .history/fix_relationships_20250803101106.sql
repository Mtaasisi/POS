-- Fix Foreign Key Relationships
-- Run this in your Supabase SQL Editor to fix the 400 errors

-- 1. Add foreign key for category_id in products table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_category') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_category 
        FOREIGN KEY (category_id) REFERENCES inventory_categories(id);
    END IF;
END $$;

-- 2. Add foreign key for supplier_id in products table  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_supplier') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
    END IF;
END $$;

-- 3. Add foreign key for product_id in product_variants table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_variants_product') THEN
        ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- 5. Add some sample data to test with
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

-- 6. Test the relationships work
-- This should now work without errors
SELECT 
  p.name as product_name,
  c.name as category_name,
  s.name as supplier_name
FROM products p
LEFT JOIN inventory_categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LIMIT 5; 