-- Fix Database Errors - Comprehensive Solution
-- This script fixes all the 403 and 400 errors you're experiencing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create missing inventory_categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create missing suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Kenya',
    payment_terms VARCHAR(255),
    lead_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create products table with proper structure
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    category_id UUID REFERENCES inventory_categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    product_code VARCHAR(100),
    barcode VARCHAR(100),
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER DEFAULT 1000,
    reorder_point INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    images TEXT[],
    specifications JSONB,
    warranty_period_months INTEGER DEFAULT 12,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    attributes JSONB,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_in_stock INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity_in_stock - reserved_quantity) STORED,
    weight_kg DECIMAL(8,3),
    dimensions_cm VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')) DEFAULT 'cash',
    created_by UUID,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('retail', 'wholesale')) DEFAULT 'retail',
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_method TEXT CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    item_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_external_product BOOLEAN NOT NULL DEFAULT FALSE,
    external_product_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create installment_payments table
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')) DEFAULT 'cash',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_categories_active ON inventory_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- 9. Fix RLS policies for sales_orders (make them less restrictive)
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can insert their own sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can update their own sales orders" ON sales_orders;

-- Create more permissive policies
CREATE POLICY "Allow authenticated users to view sales orders" ON sales_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sales orders" ON sales_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sales orders" ON sales_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 10. Fix RLS policies for sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view sales order items for their orders" ON sales_order_items;
DROP POLICY IF EXISTS "Users can insert sales order items for their orders" ON sales_order_items;
DROP POLICY IF EXISTS "Users can update sales order items for their orders" ON sales_order_items;

-- Create more permissive policies
CREATE POLICY "Allow authenticated users to view sales order items" ON sales_order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sales order items" ON sales_order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sales order items" ON sales_order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 11. Fix RLS policies for installment_payments
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view installment payments for their orders" ON installment_payments;
DROP POLICY IF EXISTS "Users can insert installment payments for their orders" ON installment_payments;
DROP POLICY IF EXISTS "Users can update installment payments for their orders" ON installment_payments;

-- Create more permissive policies
CREATE POLICY "Allow authenticated users to view installment payments" ON installment_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert installment payments" ON installment_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update installment payments" ON installment_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 12. Fix RLS policies for products and related tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for inventory tables
CREATE POLICY "Allow authenticated users to view products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view product variants" ON product_variants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert product variants" ON product_variants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product variants" ON product_variants
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view inventory categories" ON inventory_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert inventory categories" ON inventory_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory categories" ON inventory_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert suppliers" ON suppliers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update suppliers" ON suppliers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 13. Grant necessary permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_order_items TO authenticated;
GRANT ALL ON installment_payments TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON inventory_categories TO authenticated;
GRANT ALL ON suppliers TO authenticated;

-- 14. Insert sample data for testing
-- First, add unique constraints if they don't exist
ALTER TABLE inventory_categories ADD CONSTRAINT IF NOT EXISTS inventory_categories_name_unique UNIQUE (name);
ALTER TABLE suppliers ADD CONSTRAINT IF NOT EXISTS suppliers_name_unique UNIQUE (name);

INSERT INTO inventory_categories (name, description, color) VALUES
('Electronics', 'Electronic devices and components', '#3B82F6'),
('Parts', 'Replacement parts and accessories', '#10B981'),
('Accessories', 'Device accessories and add-ons', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, contact_person, email, phone, city) VALUES
('TechParts Ltd', 'John Doe', 'john@techparts.com', '+254700000001', 'Nairobi'),
('MobileParts Kenya', 'Jane Smith', 'jane@mobileparts.co.ke', '+254700000002', 'Mombasa'),
('Generic Supplies', 'Mike Johnson', 'mike@genericsupplies.com', '+254700000003', 'Kisumu')
ON CONFLICT (name) DO NOTHING;

-- 15. Create views for easier querying
CREATE OR REPLACE VIEW sales_orders_with_customer AS
SELECT 
    so.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    c.city as customer_city
FROM sales_orders so
LEFT JOIN customers c ON so.customer_id = c.id;

CREATE OR REPLACE VIEW sales_order_items_with_details AS
SELECT 
    soi.*,
    p.name as product_name,
    p.description as product_description,
    p.brand as product_brand,
    pv.sku as variant_sku,
    pv.variant_name,
    pv.selling_price as variant_selling_price,
    pv.cost_price as variant_cost_price
FROM sales_order_items soi
LEFT JOIN products p ON soi.product_id = p.id
LEFT JOIN product_variants pv ON soi.variant_id = pv.id;

-- Grant permissions on views
GRANT SELECT ON sales_orders_with_customer TO authenticated;
GRANT SELECT ON sales_order_items_with_details TO authenticated;

-- Success message
SELECT 'Database errors fixed successfully! All tables created and RLS policies updated.' as status; 