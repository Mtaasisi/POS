-- Safe Inventory Tables Fix
-- This script creates missing inventory tables without conflicts

-- Create inventory_categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
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

-- Create products table
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

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    attributes JSONB,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity_in_stock - reserved_quantity) STORED,
    weight_kg DECIMAL(8,3),
    dimensions_cm VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    reason TEXT,
    cost_price DECIMAL(10,2),
    performed_by UUID,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category_id') THEN
        CREATE INDEX idx_products_category_id ON products(category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_supplier_id') THEN
        CREATE INDEX idx_products_supplier_id ON products(supplier_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_is_active') THEN
        CREATE INDEX idx_products_is_active ON products(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_variants_product_id') THEN
        CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_variants_sku') THEN
        CREATE INDEX idx_product_variants_sku ON product_variants(sku);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_images_product_id') THEN
        CREATE INDEX idx_product_images_product_id ON product_images(product_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_movements_variant_id') THEN
        CREATE INDEX idx_stock_movements_variant_id ON stock_movements(variant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_movements_movement_type') THEN
        CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
    END IF;
END $$;

-- Insert sample data only if tables are empty
INSERT INTO inventory_categories (name, description, color) 
SELECT * FROM (VALUES 
    ('Electronics', 'Electronic devices and accessories', '#3B82F6'),
    ('Accessories', 'Device accessories and peripherals', '#10B981'),
    ('Parts', 'Replacement parts and components', '#F59E0B')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM inventory_categories LIMIT 1);

INSERT INTO suppliers (name, contact_person, email, phone, city) 
SELECT * FROM (VALUES 
    ('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700123456', 'Nairobi'),
    ('Global Electronics', 'Jane Smith', 'jane@globalelectronics.com', '+254700654321', 'Mombasa'),
    ('Local Parts Co', 'Mike Johnson', 'mike@localparts.co.ke', '+254700789012', 'Kisumu')
) AS v(name, contact_person, email, phone, city)
WHERE NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1);

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_categories;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_categories;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON inventory_categories;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON inventory_categories;
    
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON suppliers;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON suppliers;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON suppliers;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON suppliers;
    
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON products;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON products;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON products;
    
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON product_variants;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON product_variants;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON product_variants;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON product_variants;
    
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON product_images;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON product_images;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON product_images;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON product_images;
    
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stock_movements;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON stock_movements;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON stock_movements;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON stock_movements;
END $$;

-- Create RLS policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON inventory_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON inventory_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON inventory_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON inventory_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON suppliers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON suppliers FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON product_variants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON product_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON product_variants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON product_variants FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON product_images FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON product_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON product_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON product_images FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON stock_movements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON stock_movements FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop if exists first)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_inventory_categories_updated_at ON inventory_categories;
    DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
    DROP TRIGGER IF EXISTS update_products_updated_at ON products;
    DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
    DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
END $$;

CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON inventory_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON inventory_categories TO authenticated;
GRANT ALL ON suppliers TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON stock_movements TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Inventory tables created/updated successfully!' as status; 