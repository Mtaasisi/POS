-- POS System Database Setup
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    manager VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')),
    created_by UUID REFERENCES auth.users(id),
    customer_type VARCHAR(50) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    delivery_address TEXT,
    delivery_city VARCHAR(255),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
    delivery_notes TEXT,
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sales Order Items Table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    item_total DECIMAL(10,2) NOT NULL,
    is_external_product BOOLEAN DEFAULT FALSE,
    external_product_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Installment Payments Table
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Loyalty Customers Table
CREATE TABLE IF NOT EXISTS loyalty_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) UNIQUE,
    points INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_spent DECIMAL(10,2) DEFAULT 0,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rewards_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Loyalty Rewards Table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    discount_amount DECIMAL(10,2),
    discount_percentage INTEGER,
    category VARCHAR(50) CHECK (category IN ('discount', 'free_item', 'cashback', 'upgrade')),
    is_active BOOLEAN DEFAULT TRUE,
    tier_required VARCHAR(50) DEFAULT 'bronze' CHECK (tier_required IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Gift Cards Table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_number VARCHAR(50) UNIQUE NOT NULL,
    initial_amount DECIMAL(10,2) NOT NULL,
    current_balance DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    issued_by UUID REFERENCES auth.users(id),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Gift Card Transactions Table
CREATE TABLE IF NOT EXISTS gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id UUID REFERENCES gift_cards(id),
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    order_id UUID REFERENCES sales_orders(id),
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tax Rates Table
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Returns and Refunds Table
CREATE TABLE IF NOT EXISTS returns_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_order_id UUID REFERENCES sales_orders(id),
    return_reason VARCHAR(255),
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_method VARCHAR(50) CHECK (refund_method IN ('cash', 'card', 'gift_card', 'store_credit')),
    processed_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Return Items Table
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns_refunds(id) ON DELETE CASCADE,
    original_item_id UUID REFERENCES sales_order_items(id),
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    condition VARCHAR(50) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_location_id ON sales_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_installment_payments_order_id ON installment_payments(order_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_customers_customer_id ON loyalty_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_tier ON loyalty_customers(tier);

CREATE INDEX IF NOT EXISTS idx_gift_cards_card_number ON gift_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_gift_cards_is_active ON gift_cards(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view locations" ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view sales orders" ON sales_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert sales orders" ON sales_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sales orders" ON sales_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO locations (name, address, phone, manager, status) VALUES
('Main Repair Center', '123 Tech Street, Lagos', '+234 801 234 5678', 'John Doe', 'active'),
('Victoria Island Branch', '456 Business Ave, Victoria Island', '+234 802 345 6789', 'Jane Smith', 'active'),
('Ikeja Service Center', '789 Service Road, Ikeja', '+234 803 456 7890', 'Mike Johnson', 'maintenance'),
('Lekki Express', '321 Express Way, Lekki', '+234 804 567 8901', 'Sarah Wilson', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_rewards (name, description, points_cost, discount_percentage, category, tier_required) VALUES
('10% Off Next Purchase', 'Get 10% off your next purchase of any item', 500, 10, 'discount', 'bronze'),
('Free Screen Protector', 'Get a free screen protector with any phone purchase', 300, NULL, 'free_item', 'silver'),
('₦5,000 Cashback', 'Get ₦5,000 cashback on your next purchase', 1000, NULL, 'cashback', 'gold'),
('Priority Service', 'Skip the queue and get priority service', 200, NULL, 'upgrade', 'platinum'),
('25% Off Repair Service', 'Get 25% off any repair service', 800, 25, 'discount', 'gold')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_customers_updated_at BEFORE UPDATE ON loyalty_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_returns_refunds_updated_at BEFORE UPDATE ON returns_refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create function to update loyalty points on sale
CREATE OR REPLACE FUNCTION update_loyalty_points_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    points_to_add INTEGER;
    customer_exists BOOLEAN;
BEGIN
    -- Calculate points (1 point per ₦100 spent)
    points_to_add := FLOOR(NEW.final_amount / 100);
    
    -- Check if customer exists in loyalty program
    SELECT EXISTS(SELECT 1 FROM loyalty_customers WHERE customer_id = NEW.customer_id) INTO customer_exists;
    
    IF customer_exists AND points_to_add > 0 THEN
        -- Update loyalty points
        UPDATE loyalty_customers 
        SET points = points + points_to_add,
            total_spent = total_spent + NEW.final_amount,
            last_visit = NOW()
        WHERE customer_id = NEW.customer_id;
    ELSIF NOT customer_exists AND points_to_add > 0 THEN
        -- Create new loyalty customer
        INSERT INTO loyalty_customers (customer_id, points, total_spent, last_visit)
        VALUES (NEW.customer_id, points_to_add, NEW.final_amount, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for loyalty points update
CREATE TRIGGER update_loyalty_on_sale AFTER INSERT ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_loyalty_points_on_sale();

COMMENT ON TABLE locations IS 'Stores information about different business locations';
COMMENT ON TABLE sales_orders IS 'Main sales orders table with customer and payment information';
COMMENT ON TABLE sales_order_items IS 'Individual items within each sales order';
COMMENT ON TABLE installment_payments IS 'Records partial payments for installment orders';
COMMENT ON TABLE loyalty_customers IS 'Customer loyalty program information';
COMMENT ON TABLE loyalty_rewards IS 'Available rewards in the loyalty program';
COMMENT ON TABLE gift_cards IS 'Gift card information and balances';
COMMENT ON TABLE gift_card_transactions IS 'Gift card purchase and redemption history';
COMMENT ON TABLE tax_rates IS 'Tax rates for different locations';
COMMENT ON TABLE returns_refunds IS 'Returns and refunds information';
COMMENT ON TABLE return_items IS 'Individual items being returned'; 