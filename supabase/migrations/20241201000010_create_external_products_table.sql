-- Migration: 20241201000010_create_external_products_table.sql
-- Create external products table for tracking products from local suppliers

-- External Products table
CREATE TABLE IF NOT EXISTS lats_external_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT,
    brand TEXT,
    barcode TEXT,
    supplier_name TEXT NOT NULL,
    supplier_phone TEXT,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    purchase_quantity INTEGER NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    warranty_info TEXT,
    product_condition TEXT NOT NULL CHECK (product_condition IN ('new', 'used', 'refurbished')),
    notes TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_external_products_sku ON lats_external_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_external_products_supplier ON lats_external_products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_lats_external_products_status ON lats_external_products(status);
CREATE INDEX IF NOT EXISTS idx_lats_external_products_created_at ON lats_external_products(created_at);

-- Enable RLS
ALTER TABLE lats_external_products ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage external products" ON lats_external_products 
FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_external_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_external_products_updated_at 
    BEFORE UPDATE ON lats_external_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_lats_external_products_updated_at();
