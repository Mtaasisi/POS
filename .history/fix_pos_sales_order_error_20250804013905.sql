-- Fix POS Sales Order 400 Error
-- Run this in your Supabase SQL Editor

-- 1. First, let's ensure we have the proper tables and structure
DO $$
BEGIN
    -- Create locations table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
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
        
        -- Insert default location with proper UUID
        INSERT INTO locations (id, name, address, phone, manager) 
        VALUES (
            gen_random_uuid(),
            'Main Repair Center', 
            '123 Tech Street, Lagos', 
            '+234 801 234 5678', 
            'John Doe'
        );
        
        RAISE NOTICE 'locations table created with default location';
    END IF;
    
    -- Create sales_orders table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
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
            location_id UUID REFERENCES locations(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'sales_orders table created successfully';
    END IF;
    
    -- Create sales_order_items table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_order_items') THEN
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

-- 2. Enable RLS and create policies
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_orders;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_order_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON locations;

-- Create new policies
CREATE POLICY "Enable all operations for authenticated users" ON sales_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON sales_order_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON locations
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Check if we have a proper location, if not create one
DO $$
DECLARE
    location_count INTEGER;
    new_location_id UUID;
BEGIN
    -- Count existing locations
    SELECT COUNT(*) INTO location_count FROM locations;
    
    IF location_count = 0 THEN
        -- No locations exist, create a default one
        INSERT INTO locations (id, name, address, phone, manager) 
        VALUES (
            gen_random_uuid(),
            'Main Repair Center', 
            '123 Tech Street, Lagos', 
            '+234 801 234 5678', 
            'John Doe'
        ) RETURNING id INTO new_location_id;
        
        RAISE NOTICE 'Created default location with ID: %', new_location_id;
    ELSE
        RAISE NOTICE 'Found % existing location(s)', location_count;
    END IF;
END $$;

-- 4. Test the fix
DO $$
DECLARE
    test_location_id UUID;
    test_order_id UUID;
    test_customer_id UUID;
BEGIN
    -- Get the first location (should be the default one)
    SELECT id INTO test_location_id FROM locations LIMIT 1;
    
    IF test_location_id IS NULL THEN
        RAISE EXCEPTION 'No location found. Please run the location creation part first.';
    END IF;
    
    -- Create a test customer ID
    test_customer_id := gen_random_uuid();
    
    RAISE NOTICE 'Testing with location_id: %', test_location_id;
    
    -- Test insert into sales_orders with the exact data structure from POSPage
    INSERT INTO sales_orders (
        customer_id,
        total_amount,
        discount_amount,
        tax_amount,
        shipping_cost,
        final_amount,
        amount_paid,
        balance_due,
        payment_method,
        customer_type,
        delivery_address,
        delivery_city,
        delivery_method,
        delivery_notes,
        location_id,
        created_by,
        status
    ) VALUES (
        test_customer_id,
        6400.00,
        0.00,
        1024.00,
        0.00,
        7424.00,
        7424.00,
        0.00,
        'card',
        'retail',
        '',
        '',
        'pickup',
        '',
        test_location_id,
        gen_random_uuid(),
        'completed'
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE '✅ Test insert successful! Order ID: %', test_order_id;
    
    -- Clean up test data
    DELETE FROM sales_orders WHERE id = test_order_id;
    
    RAISE NOTICE '✅ Test completed successfully. sales_orders table is working properly.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during test: %', SQLERRM;
    RAISE NOTICE '❌ Error detail: %', SQLSTATE;
END $$;

-- 5. Show the current location ID for the frontend
SELECT 
    id as location_id,
    name as location_name,
    address as location_address
FROM locations 
WHERE name = 'Main Repair Center' 
LIMIT 1; 