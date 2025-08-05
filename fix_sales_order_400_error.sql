-- Fix common issues that cause 400 errors in sales_orders table
-- Run this in your Supabase SQL Editor

-- 1. First, let's check what we're working with
DO $$
BEGIN
    -- Check if sales_orders table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
        RAISE NOTICE 'sales_orders table does not exist. Creating it...';
        
        -- Create sales_orders table with proper structure
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
    
    -- Check if locations table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
        RAISE NOTICE 'locations table does not exist. Creating it...';
        
        CREATE TABLE locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            phone VARCHAR(50),
            manager VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default location
        INSERT INTO locations (name, address, phone, manager) 
        VALUES ('Main Repair Center', 'Default Address', '+255000000000', 'Manager') 
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'locations table created with default location';
    END IF;
    
    -- Check if sales_order_items table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_order_items') THEN
        RAISE NOTICE 'sales_order_items table does not exist. Creating it...';
        
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

-- 2. Enable RLS on sales_orders if not already enabled
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- 3. Create basic RLS policy for sales_orders
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_orders;
CREATE POLICY "Enable all operations for authenticated users" ON sales_orders
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Create basic RLS policy for sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_order_items;
CREATE POLICY "Enable all operations for authenticated users" ON sales_order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Create basic RLS policy for locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON locations;
CREATE POLICY "Enable all operations for authenticated users" ON locations
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Test insert to verify everything works
DO $$
DECLARE
    test_order_id UUID;
    test_location_id UUID;
BEGIN
    -- Get or create a test location
    SELECT id INTO test_location_id FROM locations LIMIT 1;
    IF test_location_id IS NULL THEN
        INSERT INTO locations (name, address) VALUES ('Test Location', 'Test Address') RETURNING id INTO test_location_id;
    END IF;
    
    -- Test insert into sales_orders
    INSERT INTO sales_orders (
        customer_id,
        total_amount,
        final_amount,
        payment_method,
        customer_type,
        location_id
    ) VALUES (
        gen_random_uuid(), -- dummy customer_id
        100.00,
        100.00,
        'card',
        'retail',
        test_location_id
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE 'Test insert successful. Order ID: %', test_order_id;
    
    -- Clean up test data
    DELETE FROM sales_orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully. sales_orders table is working properly.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during test: %', SQLERRM;
END $$; 