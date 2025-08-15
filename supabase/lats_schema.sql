-- LATS Inventory Management System Database Schema
-- This file contains all the tables needed for the LATS module

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS lats_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS lats_brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS lats_suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Stock movements table
CREATE TABLE IF NOT EXISTS lats_stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS lats_purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE DEFAULT 'PO-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    supplier_id UUID NOT NULL REFERENCES lats_suppliers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0,
    expected_delivery DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS lats_purchase_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spare parts table
CREATE TABLE IF NOT EXISTS lats_spare_parts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Spare part usage table
CREATE TABLE IF NOT EXISTS lats_spare_part_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    device_id UUID,
    customer_id UUID,
    reason TEXT NOT NULL,
    notes TEXT,
    used_by UUID,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart table
CREATE TABLE IF NOT EXISTS lats_cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS lats_cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES lats_cart(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS lats_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT NOT NULL UNIQUE DEFAULT 'SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    customer_id UUID,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE IF NOT EXISTS lats_sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS settings table
CREATE TABLE IF NOT EXISTS lats_pos_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_rate DECIMAL(5,4) DEFAULT 0.16,
    currency TEXT DEFAULT 'TZS',
    receipt_header TEXT DEFAULT 'LATS Device Repair',
    receipt_footer TEXT DEFAULT 'Thank you for your business!',
    enable_barcode_scanning BOOLEAN DEFAULT true,
    enable_quick_cash BOOLEAN DEFAULT true,
    enable_discounts BOOLEAN DEFAULT true,
    enable_tax BOOLEAN DEFAULT true,
    default_payment_method TEXT DEFAULT 'cash',
    receipt_printer TEXT DEFAULT 'default',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_category ON lats_products(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_brand ON lats_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_supplier ON lats_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_active ON lats_products(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_products_name ON lats_products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_lats_products_description ON lats_products USING gin(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_barcode ON lats_product_variants(barcode);

CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_product ON lats_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_variant ON lats_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_created_at ON lats_stock_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_supplier ON lats_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_status ON lats_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_orders_created_at ON lats_purchase_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_lats_cart_user ON lats_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_lats_cart_items_cart ON lats_cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_lats_sales_customer ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_categories_updated_at BEFORE UPDATE ON lats_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_brands_updated_at BEFORE UPDATE ON lats_brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_suppliers_updated_at BEFORE UPDATE ON lats_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_products_updated_at BEFORE UPDATE ON lats_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_product_variants_updated_at BEFORE UPDATE ON lats_product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_purchase_orders_updated_at BEFORE UPDATE ON lats_purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_spare_parts_updated_at BEFORE UPDATE ON lats_spare_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_cart_updated_at BEFORE UPDATE ON lats_cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_cart_items_updated_at BEFORE UPDATE ON lats_cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_sales_updated_at BEFORE UPDATE ON lats_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lats_pos_settings_updated_at BEFORE UPDATE ON lats_pos_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product totals when variants change
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

-- Create triggers for updating product totals
CREATE TRIGGER update_product_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_product_variants 
    FOR EACH ROW EXECUTE FUNCTION update_product_totals();

-- Function to calculate cart totals
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lats_cart 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM lats_cart_items 
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        total = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM lats_cart_items 
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for updating cart totals
CREATE TRIGGER update_cart_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_cart_totals();

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

-- Create triggers for updating sale totals
CREATE TRIGGER update_sale_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_sale_items 
    FOR EACH ROW EXECUTE FUNCTION update_sale_totals();

-- Function to calculate purchase order totals
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lats_purchase_orders 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM lats_purchase_order_items 
            WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for updating purchase order totals
CREATE TRIGGER update_purchase_order_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON lats_purchase_order_items 
    FOR EACH ROW EXECUTE FUNCTION update_purchase_order_totals();

-- Analytics functions
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

-- Insert default POS settings
INSERT INTO lats_pos_settings (id) 
VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_spare_part_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_pos_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow users to manage their own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to manage categories" ON lats_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage brands" ON lats_brands FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage suppliers" ON lats_suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage products" ON lats_products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage product variants" ON lats_product_variants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage stock movements" ON lats_stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage purchase orders" ON lats_purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage purchase order items" ON lats_purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage spare parts" ON lats_spare_parts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage spare part usage" ON lats_spare_part_usage FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to manage their own cart" ON lats_cart FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow users to manage their own cart items" ON lats_cart_items FOR ALL USING (auth.uid() = (SELECT user_id FROM lats_cart WHERE id = cart_id));
CREATE POLICY "Allow authenticated users to manage sales" ON lats_sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage sale items" ON lats_sale_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage POS settings" ON lats_pos_settings FOR ALL USING (auth.role() = 'authenticated');

-- Ensure every product has at least one variant
CREATE OR REPLACE FUNCTION ensure_product_has_variants()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a DELETE operation on variants
  IF TG_OP = 'DELETE' THEN
    -- Check if this was the last variant for the product
    IF NOT EXISTS (
      SELECT 1 FROM lats_product_variants 
      WHERE product_id = OLD.product_id 
      AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete the last variant of a product. Every product must have at least one variant.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent deletion of last variant
CREATE TRIGGER ensure_product_has_variants_trigger
    BEFORE DELETE ON lats_product_variants
    FOR EACH ROW EXECUTE FUNCTION ensure_product_has_variants();

-- Function to ensure new products get a default variant
CREATE OR REPLACE FUNCTION create_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default variant for the new product
  INSERT INTO lats_product_variants (
    product_id,
    sku,
    name,
    attributes,
    cost_price,
    selling_price,
    quantity,
    min_quantity,
    max_quantity
  ) VALUES (
    NEW.id,
    NEW.name || '-DEFAULT',
    'Default Variant',
    '{}',
    0,
    0,
    0,
    0,
    100
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default variant for new products
CREATE TRIGGER create_default_variant_trigger
    AFTER INSERT ON lats_products
    FOR EACH ROW EXECUTE FUNCTION create_default_variant();
