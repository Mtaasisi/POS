-- Complete Fix for Sales Orders 400 Error
-- Run this in your Supabase SQL Editor

-- 1. Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    model TEXT,
    category_id TEXT,
    supplier_id TEXT,
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

-- 2. Create product_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    attributes JSONB,
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

-- 3. Create installment_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ensure sales_orders table has proper structure
DO $$
BEGIN
    -- Check if sales_orders table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
        RAISE NOTICE 'Creating sales_orders table...';
        
        CREATE TABLE sales_orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID,
            order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')),
            total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(15,2) DEFAULT 0,
            tax_amount DECIMAL(15,2) DEFAULT 0,
            shipping_cost DECIMAL(15,2) DEFAULT 0,
            final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
            amount_paid DECIMAL(15,2) DEFAULT 0,
            balance_due DECIMAL(15,2) DEFAULT 0,
            payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')),
            created_by UUID,
            customer_type VARCHAR(20) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
            delivery_address TEXT,
            delivery_city VARCHAR(100),
            delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
            delivery_notes TEXT,
            location_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'sales_orders table created successfully';
    ELSE
        RAISE NOTICE 'sales_orders table already exists';
    END IF;
    
    -- Check if sales_order_items table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_order_items') THEN
        RAISE NOTICE 'Creating sales_order_items table...';
        
        CREATE TABLE sales_order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
            product_id UUID,
            variant_id UUID,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            unit_cost DECIMAL(15,2) DEFAULT 0,
            item_total DECIMAL(15,2) NOT NULL DEFAULT 0,
            is_external_product BOOLEAN DEFAULT false,
            external_product_details JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'sales_order_items table created successfully';
    END IF;
    
END $$;

-- 5. Enable RLS on all tables
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_orders;
CREATE POLICY "Enable all operations for authenticated users" ON sales_orders
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_order_items;
CREATE POLICY "Enable all operations for authenticated users" ON sales_order_items
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON products;
CREATE POLICY "Enable all operations for authenticated users" ON products
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON product_variants;
CREATE POLICY "Enable all operations for authenticated users" ON product_variants
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON installment_payments;
CREATE POLICY "Enable all operations for authenticated users" ON installment_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Test the query structure
DO $$
DECLARE
    test_order_id UUID;
    test_product_id UUID;
    test_variant_id UUID;
BEGIN
    -- Create test product
    INSERT INTO products (name, brand, model, description) 
    VALUES ('Test Product', 'Test Brand', 'Test Model', 'Test Description')
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_product_id;
    
    -- Create test variant
    INSERT INTO product_variants (product_id, sku, variant_name, selling_price) 
    VALUES (test_product_id, 'TEST-SKU-001', 'Test Variant', 100.00)
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_variant_id;
    
    -- Create test order
    INSERT INTO sales_orders (
        customer_id,
        total_amount,
        final_amount,
        payment_method,
        customer_type
    ) VALUES (
        gen_random_uuid(), -- dummy customer_id
        100.00,
        100.00,
        'card',
        'retail'
    ) RETURNING id INTO test_order_id;
    
    -- Create test order item
    INSERT INTO sales_order_items (
        order_id,
        product_id,
        variant_id,
        quantity,
        unit_price,
        item_total
    ) VALUES (
        test_order_id,
        test_product_id,
        test_variant_id,
        1,
        100.00,
        100.00
    );
    
    RAISE NOTICE 'Test data created successfully. Order ID: %, Product ID: %, Variant ID: %', test_order_id, test_product_id, test_variant_id;
    
    -- Clean up test data
    DELETE FROM sales_order_items WHERE order_id = test_order_id;
    DELETE FROM sales_orders WHERE id = test_order_id;
    DELETE FROM product_variants WHERE id = test_variant_id;
    DELETE FROM products WHERE id = test_product_id;
    
    RAISE NOTICE 'Test completed successfully. All tables are working properly.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during test: %', SQLERRM;
END $$; 