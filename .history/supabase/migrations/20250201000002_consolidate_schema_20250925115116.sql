-- Consolidated Database Schema for Production
-- Migration: 20250201000002_consolidate_schema.sql
-- This migration consolidates all schema changes and fixes inconsistencies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES (Ensure they exist with correct structure)
-- =====================================================

-- Ensure auth_users table exists (if not using Supabase auth.users)
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    username TEXT,
    name TEXT,
    role TEXT DEFAULT 'technician',
    is_active BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure customers table exists
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    loyalty_level TEXT DEFAULT 'bronze',
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    color_tag TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LATS INVENTORY TABLES
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS lats_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS lats_brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS lats_suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS lats_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lats_categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES lats_brands(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES lats_suppliers(id) ON DELETE SET NULL,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    total_quantity INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants table
CREATE TABLE IF NOT EXISTS lats_product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    attributes JSONB DEFAULT '{}',
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    barcode TEXT,
    weight DECIMAL(8,2),
    dimensions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS lats_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_number TEXT NOT NULL UNIQUE DEFAULT 'SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE IF NOT EXISTS lats_sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spare parts table
CREATE TABLE IF NOT EXISTS lats_spare_parts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lats_categories(id) ON DELETE SET NULL,
    part_number TEXT UNIQUE,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    location TEXT,
    barcode TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_brand ON lats_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_supplier ON lats_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_active ON lats_products(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products USING gin(to_tsvector('english', name));

-- Variant indexes
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_barcode ON lats_product_variants(barcode);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);

-- Spare parts indexes
CREATE INDEX IF NOT EXISTS idx_lats_spare_parts_category ON lats_spare_parts(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_spare_parts_part_number ON lats_spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_lats_spare_parts_active ON lats_spare_parts(is_active);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update product totals
CREATE OR REPLACE FUNCTION update_product_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lats_products 
    SET 
        total_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM lats_product_variants 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        total_value = (
            SELECT COALESCE(SUM(quantity * cost_price), 0) 
            FROM lats_product_variants 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to calculate sale totals
CREATE OR REPLACE FUNCTION update_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lats_sales 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM lats_sale_items 
            WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_lats_products_updated_at ON lats_products;
CREATE TRIGGER update_lats_products_updated_at BEFORE UPDATE ON lats_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lats_product_variants_updated_at ON lats_product_variants;
CREATE TRIGGER update_lats_product_variants_updated_at BEFORE UPDATE ON lats_product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lats_sales_updated_at ON lats_sales;
CREATE TRIGGER update_lats_sales_updated_at BEFORE UPDATE ON lats_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lats_spare_parts_updated_at ON lats_spare_parts;
CREATE TRIGGER update_lats_spare_parts_updated_at BEFORE UPDATE ON lats_spare_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_totals_trigger ON lats_product_variants;
CREATE TRIGGER update_product_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_product_variants 
    FOR EACH ROW EXECUTE FUNCTION update_product_totals();

DROP TRIGGER IF EXISTS update_sale_totals_trigger ON lats_sale_items;
CREATE TRIGGER update_sale_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_sale_items 
    FOR EACH ROW EXECUTE FUNCTION update_sale_totals();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE lats_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_spare_parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON lats_categories;
CREATE POLICY "Allow authenticated users to manage categories" ON lats_categories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage brands" ON lats_brands;
CREATE POLICY "Allow authenticated users to manage brands" ON lats_brands FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON lats_suppliers;
CREATE POLICY "Allow authenticated users to manage suppliers" ON lats_suppliers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
CREATE POLICY "Allow authenticated users to manage products" ON lats_products FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage product variants" ON lats_product_variants;
CREATE POLICY "Allow authenticated users to manage product variants" ON lats_product_variants FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;
CREATE POLICY "Allow authenticated users to manage sales" ON lats_sales FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage sale items" ON lats_sale_items;
CREATE POLICY "Allow authenticated users to manage sale items" ON lats_sale_items FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage spare parts" ON lats_spare_parts;
CREATE POLICY "Allow authenticated users to manage spare parts" ON lats_spare_parts FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get inventory stats
CREATE OR REPLACE FUNCTION get_inventory_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (SELECT COUNT(*) FROM lats_products WHERE is_active = true),
        'total_variants', (SELECT COUNT(*) FROM lats_product_variants),
        'total_stock', (SELECT COALESCE(SUM(total_quantity), 0) FROM lats_products),
        'total_value', (SELECT COALESCE(SUM(total_value), 0) FROM lats_products),
        'low_stock_items', (SELECT COUNT(*) FROM lats_products WHERE total_quantity <= 10),
        'out_of_stock_items', (SELECT COUNT(*) FROM lats_products WHERE total_quantity = 0),
        'categories_count', (SELECT COUNT(*) FROM lats_categories),
        'brands_count', (SELECT COUNT(*) FROM lats_brands),
        'suppliers_count', (SELECT COUNT(*) FROM lats_suppliers)
    ) INTO result;
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Function to get sales stats
CREATE OR REPLACE FUNCTION get_sales_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sales', (SELECT COUNT(*) FROM lats_sales WHERE status = 'completed'),
        'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM lats_sales WHERE status = 'completed'),
        'today_sales', (SELECT COUNT(*) FROM lats_sales WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE),
        'today_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM lats_sales WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE),
        'this_month_sales', (SELECT COUNT(*) FROM lats_sales WHERE status = 'completed' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
        'this_month_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM lats_sales WHERE status = 'completed' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
        'average_sale', (SELECT COALESCE(AVG(total_amount), 0) FROM lats_sales WHERE status = 'completed')
    ) INTO result;
    
    RETURN result;
END;
$$ language 'plpgsql';
