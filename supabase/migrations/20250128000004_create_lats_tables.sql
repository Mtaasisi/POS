-- Create LATS sales and related tables
-- Migration: 20250128000004_create_lats_tables.sql

-- Create lats_sales table
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

-- Create lats_sale_items table
CREATE TABLE IF NOT EXISTS lats_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_products table (if not exists)
CREATE TABLE IF NOT EXISTS lats_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_product_variants table (if not exists)
CREATE TABLE IF NOT EXISTS lats_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    attributes JSONB,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_receipts table
CREATE TABLE IF NOT EXISTS lats_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    items_count INTEGER NOT NULL,
    generated_by VARCHAR(255) NOT NULL,
    receipt_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lats_stock_movements table
CREATE TABLE IF NOT EXISTS lats_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER DEFAULT 0,
    new_quantity INTEGER DEFAULT 0,
    reason VARCHAR(100) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_variant_id ON lats_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_created_at ON lats_stock_movements(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_lats_sales_updated_at
    BEFORE UPDATE ON lats_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lats_sale_items_updated_at
    BEFORE UPDATE ON lats_sale_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lats_products_updated_at
    BEFORE UPDATE ON lats_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lats_product_variants_updated_at
    BEFORE UPDATE ON lats_product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_stock_movements ENABLE ROW LEVEL SECURITY;

-- Admin can manage all LATS data
CREATE POLICY "Admin can manage lats_sales" ON lats_sales
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage lats_sale_items" ON lats_sale_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage lats_products" ON lats_products
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage lats_product_variants" ON lats_product_variants
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage lats_receipts" ON lats_receipts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage lats_stock_movements" ON lats_stock_movements
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Authenticated users can view LATS data
CREATE POLICY "Authenticated users can view lats_sales" ON lats_sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view lats_sale_items" ON lats_sale_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view lats_products" ON lats_products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view lats_product_variants" ON lats_product_variants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view lats_receipts" ON lats_receipts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view lats_stock_movements" ON lats_stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');
