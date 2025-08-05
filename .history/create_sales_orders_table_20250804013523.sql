-- Create Sales Orders Table
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
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
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')),
    created_by UUID REFERENCES auth.users(id),
    customer_type VARCHAR(20) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
    delivery_notes TEXT,
    location_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
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

-- Enable Row Level Security
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can insert sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can update sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can delete sales orders" ON sales_orders;

DROP POLICY IF EXISTS "Users can view sales order items" ON sales_order_items;
DROP POLICY IF EXISTS "Users can insert sales order items" ON sales_order_items;
DROP POLICY IF EXISTS "Users can update sales order items" ON sales_order_items;
DROP POLICY IF EXISTS "Users can delete sales order items" ON sales_order_items;

-- Create RLS Policies
CREATE POLICY "Users can view sales orders" ON sales_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert sales orders" ON sales_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sales orders" ON sales_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete sales orders" ON sales_orders FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view sales order items" ON sales_order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert sales order items" ON sales_order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sales order items" ON sales_order_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete sales order items" ON sales_order_items FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by ON sales_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales_order_items(product_id);

-- Grant permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_order_items TO authenticated;

-- Verify table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_orders'
ORDER BY ordinal_position; 