-- Fix POS Workflow Issues
-- Run this in your Supabase SQL Editor

-- 1. Fix sales_orders table structure
DO $$
BEGIN
    -- Drop and recreate sales_orders table with proper structure
    DROP TABLE IF EXISTS sales_orders CASCADE;
    
    CREATE TABLE sales_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')) DEFAULT 'pending',
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
        final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
        balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')) DEFAULT 'cash',
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        customer_type TEXT NOT NULL CHECK (customer_type IN ('retail', 'wholesale')) DEFAULT 'retail',
        delivery_address TEXT,
        delivery_city TEXT,
        delivery_method TEXT CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
        delivery_notes TEXT,
        location_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- sales_orders table recreated successfully
END $$;

-- 2. Fix sales_order_items table structure
DO $$
BEGIN
    -- Drop and recreate sales_order_items table
    DROP TABLE IF EXISTS sales_order_items CASCADE;
    
    CREATE TABLE sales_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
        unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
        item_total DECIMAL(15,2) NOT NULL DEFAULT 0,
        is_external_product BOOLEAN NOT NULL DEFAULT FALSE,
        external_product_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- sales_order_items table recreated successfully
END $$;

-- 3. Fix product_variants table structure
DO $$
BEGIN
    -- Check if product_variants table exists and has correct structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
        CREATE TABLE product_variants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            sku VARCHAR(100) NOT NULL,
            variant_name VARCHAR(255) NOT NULL,
            attributes JSONB,
            cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            wholesale_price DECIMAL(15,2) DEFAULT 0,
            quantity_in_stock INTEGER NOT NULL DEFAULT 0,
            reserved_quantity INTEGER NOT NULL DEFAULT 0,
            available_quantity INTEGER GENERATED ALWAYS AS (quantity_in_stock - reserved_quantity) STORED,
            weight_kg DECIMAL(8,3),
            dimensions_cm VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if they don't exist
        ALTER TABLE product_variants 
        ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(15,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS available_quantity INTEGER GENERATED ALWAYS AS (quantity_in_stock - reserved_quantity) STORED;
    END IF;
    
    -- product_variants table structure updated
END $$;

-- 4. Create locations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        CREATE TABLE locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            address TEXT,
            phone VARCHAR(50),
            manager VARCHAR(255),
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default location
        INSERT INTO locations (name, address, phone, manager) 
        VALUES ('Main Repair Center', '123 Tech Street, Lagos', '+234 123 456 7890', 'Manager');
    END IF;
    
    -- locations table created/verified
END $$;

-- 5. Create installment_payments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'installment_payments') THEN
        CREATE TABLE installment_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
            payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            amount DECIMAL(15,2) NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')) DEFAULT 'cash',
            notes TEXT,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- installment_payments table created/verified
END $$;

-- 6. Create loyalty_customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_customers') THEN
        CREATE TABLE loyalty_customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            points INTEGER NOT NULL DEFAULT 0,
            tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
            total_spent DECIMAL(15,2) NOT NULL DEFAULT 0,
            join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            rewards_redeemed INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- loyalty_customers table created/verified
END $$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_variant_id ON sales_order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_customer_id ON loyalty_customers(customer_id);

-- 8. Enable RLS and create permissive policies
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_orders;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales_order_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON installment_payments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON locations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON loyalty_customers;

-- Create permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON sales_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON sales_order_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON installment_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON locations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON loyalty_customers
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Create function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order totals when items are added/updated/deleted
    UPDATE sales_orders 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(item_total), 0) 
            FROM sales_order_items 
            WHERE order_id = NEW.order_id
        ),
        final_amount = (
            SELECT COALESCE(SUM(item_total), 0) + tax_amount + shipping_cost - discount_amount
            FROM sales_order_items 
            WHERE order_id = NEW.order_id
        ),
        balance_due = final_amount - amount_paid,
        updated_at = NOW()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order totals
DROP TRIGGER IF EXISTS trigger_update_order_totals ON sales_order_items;
CREATE TRIGGER trigger_update_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_totals();

-- 10. Create function to update loyalty points
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update loyalty points when order is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO loyalty_customers (customer_id, points, total_spent, last_visit)
        VALUES (
            NEW.customer_id,
            FLOOR(NEW.final_amount / 100), -- 1 point per 100 currency units
            NEW.final_amount,
            NOW()
        )
        ON CONFLICT (customer_id) 
        DO UPDATE SET
            points = loyalty_customers.points + FLOOR(NEW.final_amount / 100),
            total_spent = loyalty_customers.total_spent + NEW.final_amount,
            last_visit = NOW(),
            tier = CASE 
                WHEN loyalty_customers.total_spent + NEW.final_amount >= 100000 THEN 'platinum'
                WHEN loyalty_customers.total_spent + NEW.final_amount >= 50000 THEN 'gold'
                WHEN loyalty_customers.total_spent + NEW.final_amount >= 10000 THEN 'silver'
                ELSE 'bronze'
            END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loyalty points
DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON sales_orders;
CREATE TRIGGER trigger_update_loyalty_points
    AFTER UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points();

-- 11. Create function to deduct inventory
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct inventory when order item is created
    IF TG_OP = 'INSERT' AND NOT NEW.is_external_product THEN
        UPDATE product_variants 
        SET 
            quantity_in_stock = quantity_in_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.variant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory deduction
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON sales_order_items;
CREATE TRIGGER trigger_deduct_inventory
    AFTER INSERT ON sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION deduct_inventory();

-- POS workflow fixes completed successfully! 