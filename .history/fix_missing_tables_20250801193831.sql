-- Fix Missing Tables (Brands and Products)
-- Run this in your Supabase SQL Editor

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
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
  category_id UUID REFERENCES inventory_categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  product_code TEXT,
  barcode TEXT,
  minimum_stock_level INTEGER NOT NULL DEFAULT 0,
  maximum_stock_level INTEGER,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[],
  images TEXT[],
  specifications JSONB,
  warranty_period_months INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Insert sample brands
INSERT INTO brands (name, description, category, is_active) VALUES
('Apple', 'Apple Inc. - Premium electronics manufacturer', 'Electronics', true),
('Samsung', 'Samsung Electronics - Global technology leader', 'Electronics', true),
('Generic', 'Generic/Third-party replacement parts', 'Parts', true),
('TechParts', 'High-quality replacement parts supplier', 'Parts', true),
('MobileParts', 'Mobile device parts specialist', 'Parts', true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Enable read access for all users" ON brands FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON brands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON brands FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for products
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Missing tables (brands, products) created successfully!' as status; 