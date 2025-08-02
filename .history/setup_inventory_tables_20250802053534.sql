-- Setup Inventory Tables
-- This script creates the inventory management tables

-- Create inventory categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Tanzania',
  payment_terms TEXT,
  lead_time_days INTEGER DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  product_code TEXT UNIQUE,
  barcode TEXT,
  minimum_stock_level INTEGER DEFAULT 5,
  maximum_stock_level INTEGER DEFAULT 100,
  reorder_point INTEGER DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[],
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  warranty_period_months INTEGER DEFAULT 12,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  variant_name TEXT NOT NULL,
  attributes JSONB DEFAULT '{}'::jsonb,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity_in_stock - reserved_quantity) STORED,
  weight_kg DECIMAL(8,3),
  dimensions_cm TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_categories_active ON inventory_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_name ON inventory_categories(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Create trigger function for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_inventory_categories_updated_at 
    BEFORE UPDATE ON inventory_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample inventory categories
INSERT INTO inventory_categories (name, description, color) VALUES
('Phone Parts', 'Mobile phone components and accessories', '#3B82F6'),
('Laptop Parts', 'Laptop and computer components', '#10B981'),
('Accessories', 'Device accessories and peripherals', '#8B5CF6'),
('Tools', 'Repair tools and equipment', '#F59E0B'),
('Consumables', 'Consumable repair materials', '#EF4444');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city, payment_terms, lead_time_days) VALUES
('TechParts Tanzania', 'John Doe', 'john@techparts.co.tz', '+255712345678', 'Dar es Salaam', 'Dar es Salaam', 'Net 30', 7),
('Mobile Solutions Ltd', 'Jane Smith', 'jane@mobile.co.tz', '+255723456789', 'Arusha', 'Arusha', 'Net 15', 5),
('Global Electronics', 'Mike Johnson', 'mike@global.co.tz', '+255734567890', 'Mwanza', 'Mwanza', 'COD', 3);

-- Enable Row Level Security
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_categories
CREATE POLICY "Allow all authenticated users to manage inventory" ON inventory_categories
    FOR ALL USING (true);

-- Create RLS policies for suppliers
CREATE POLICY "Allow all authenticated users to manage suppliers" ON suppliers
    FOR ALL USING (true);

-- Create RLS policies for products
CREATE POLICY "Allow all authenticated users to manage products" ON products
    FOR ALL USING (true);

-- Create RLS policies for product_variants
CREATE POLICY "Allow all authenticated users to manage product variants" ON product_variants
    FOR ALL USING (true);

-- Insert sample products
INSERT INTO products (name, description, brand, model, category_id, supplier_id, product_code, minimum_stock_level, maximum_stock_level, reorder_point) VALUES
('iPhone 15 Pro Screen', 'Original quality replacement screen', 'Apple', 'iPhone 15 Pro', 
 (SELECT id FROM inventory_categories WHERE name = 'Phone Parts' LIMIT 1),
 (SELECT id FROM suppliers WHERE name = 'TechParts Tanzania' LIMIT 1),
 'IP15P-SCR-001', 5, 50, 10),

('iPhone 14 Battery', 'Replacement battery for iPhone 14', 'Apple', 'iPhone 14',
 (SELECT id FROM inventory_categories WHERE name = 'Phone Parts' LIMIT 1),
 (SELECT id FROM suppliers WHERE name = 'Mobile Solutions Ltd' LIMIT 1),
 'IP14-BAT-001', 10, 100, 20);

-- Insert sample product variants
INSERT INTO product_variants (product_id, sku, variant_name, attributes, cost_price, selling_price, quantity_in_stock) VALUES
((SELECT id FROM products WHERE product_code = 'IP15P-SCR-001' LIMIT 1), 'IP15P-SCR-001-BLK', 'Black', '{"color": "black"}', 180.00, 299.99, 15),
((SELECT id FROM products WHERE product_code = 'IP15P-SCR-001' LIMIT 1), 'IP15P-SCR-001-WHT', 'White', '{"color": "white"}', 180.00, 299.99, 12),
((SELECT id FROM products WHERE product_code = 'IP14-BAT-001' LIMIT 1), 'IP14-BAT-001-STD', 'Standard', '{"capacity": "3240mAh"}', 40.00, 79.99, 35);

SELECT 'Inventory tables created successfully!' as status; 