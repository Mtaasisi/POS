-- POS System Database Setup
-- This file creates all necessary tables for the Point of Sale system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales_orders table
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
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('retail', 'wholesale')) DEFAULT 'retail',
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_method TEXT CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_order_items table
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

-- Create installment_payments table
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')) DEFAULT 'cash',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_method ON sales_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_type ON sales_orders(customer_type);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_variant_id ON sales_order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_installment_payments_order_id ON installment_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_payment_date ON installment_payments(payment_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_order_items_updated_at BEFORE UPDATE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON installment_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate item total
CREATE OR REPLACE FUNCTION calculate_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.item_total = NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for item total calculation
CREATE TRIGGER calculate_sales_order_item_total BEFORE INSERT OR UPDATE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION calculate_item_total();

-- Create function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the sales order totals
    UPDATE sales_orders 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(item_total), 0) 
            FROM sales_order_items 
            WHERE order_id = NEW.order_id
        ),
        final_amount = (
            SELECT COALESCE(SUM(item_total), 0) 
            FROM sales_order_items 
            WHERE order_id = NEW.order_id
        ) - discount_amount + tax_amount + shipping_cost,
        balance_due = (
            SELECT COALESCE(SUM(item_total), 0) 
            FROM sales_order_items 
            WHERE order_id = NEW.order_id
        ) - discount_amount + tax_amount + shipping_cost - amount_paid
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order totals update
CREATE TRIGGER update_sales_order_totals AFTER INSERT OR UPDATE OR DELETE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- Create function to update order status based on payment
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order status based on payment method and balance
    IF NEW.payment_method = 'payment_on_delivery' THEN
        NEW.status = 'payment_on_delivery';
    ELSIF NEW.payment_method = 'installment' AND NEW.balance_due > 0 THEN
        NEW.status = 'partially_paid';
    ELSIF NEW.balance_due <= 0 THEN
        NEW.status = 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order status update
CREATE TRIGGER update_sales_order_status BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_order_status();

-- Create function to update customer total spent
CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer total spent when order is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE customers 
        SET total_spent = COALESCE(total_spent, 0) + NEW.final_amount
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customer total spent update
CREATE TRIGGER update_customer_total_spent AFTER UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_customer_total_spent();

-- Create RLS policies for sales_orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales orders" ON sales_orders
    FOR SELECT USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

CREATE POLICY "Users can insert their own sales orders" ON sales_orders
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sales orders" ON sales_orders
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

-- Create RLS policies for sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales order items for their orders" ON sales_order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM sales_orders WHERE created_by = auth.uid()
        ) OR auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can insert sales order items for their orders" ON sales_order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM sales_orders WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update sales order items for their orders" ON sales_order_items
    FOR UPDATE USING (
        order_id IN (
            SELECT id FROM sales_orders WHERE created_by = auth.uid()
        ) OR auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin'
        )
    );

-- Create RLS policies for installment_payments
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view installment payments for their orders" ON installment_payments
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM sales_orders WHERE created_by = auth.uid()
        ) OR auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can insert installment payments for their orders" ON installment_payments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update installment payments for their orders" ON installment_payments
    FOR UPDATE USING (
        auth.uid() = created_by OR auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin'
        )
    );

-- Insert sample data (optional - for testing)
-- INSERT INTO sales_orders (customer_id, total_amount, final_amount, payment_method, created_by, customer_type)
-- VALUES 
--     ('sample-customer-id', 50000, 50000, 'cash', 'sample-user-id', 'retail'),
--     ('sample-customer-id', 75000, 75000, 'card', 'sample-user-id', 'wholesale');

-- INSERT INTO sales_order_items (order_id, product_id, variant_id, quantity, unit_price, unit_cost, item_total, is_external_product)
-- VALUES 
--     ('sample-order-id', 'sample-product-id', 'sample-variant-id', 2, 25000, 20000, 50000, false);

-- Grant necessary permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_order_items TO authenticated;
GRANT ALL ON installment_payments TO authenticated;

-- Create views for easier querying
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

-- Create function to get POS statistics
CREATE OR REPLACE FUNCTION get_pos_stats()
RETURNS TABLE (
    total_sales DECIMAL(10,2),
    total_orders BIGINT,
    average_order_value DECIMAL(10,2),
    today_sales DECIMAL(10,2),
    today_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(final_amount), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(final_amount), 0) as average_order_value,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN final_amount ELSE 0 END), 0) as today_sales,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_orders
    FROM sales_orders
    WHERE status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on views and functions
GRANT SELECT ON sales_orders_with_customer TO authenticated;
GRANT SELECT ON sales_order_items_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_pos_stats() TO authenticated;

-- Create comments for documentation
COMMENT ON TABLE sales_orders IS 'Main table for storing sales orders';
COMMENT ON TABLE sales_order_items IS 'Items within each sales order';
COMMENT ON TABLE installment_payments IS 'Installment payments for sales orders';
COMMENT ON FUNCTION get_pos_stats() IS 'Returns POS statistics including total sales, orders, and today''s figures';

-- Success message
SELECT 'POS system tables created successfully!' as status; 