-- Simple Fix for Foreign Key Relationships
-- Run this in your Supabase SQL Editor

-- 1. Add foreign key for category_id in products table
ALTER TABLE products ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES inventory_categories(id);

-- 2. Add foreign key for supplier_id in products table  
ALTER TABLE products ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

-- 3. Add foreign key for product_id in product_variants table
ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 4. Add indexes for better performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- 5. Add some sample data
INSERT INTO inventory_categories (name, description, color) VALUES 
('Electronics', 'Electronic components and devices', '#3B82F6'),
('Accessories', 'Phone and device accessories', '#10B981'),
('Parts', 'Replacement parts and components', '#F59E0B');

INSERT INTO suppliers (name, contact_person, email, phone, city) VALUES 
('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700000001', 'Nairobi'),
('Mobile Parts Co', 'Jane Smith', 'jane@mobileparts.co.ke', '+254700000002', 'Mombasa'),
('Electronics Hub', 'Mike Johnson', 'mike@electronicshub.com', '+254700000003', 'Nakuru');

-- 6. Test query
SELECT 'Foreign keys added successfully!' as status; 