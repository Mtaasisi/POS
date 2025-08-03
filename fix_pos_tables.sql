-- Fix POS Tables - Add Missing Columns
-- Run this script to add missing columns to existing tables

-- 1. Add location_id to sales_orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN location_id UUID REFERENCES locations(id);
    END IF;
END $$;

-- 2. Add location_id to product_variants table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN location_id UUID REFERENCES locations(id);
    END IF;
END $$;

-- 3. Add missing columns to sales_orders if they don't exist
DO $$ 
BEGIN
    -- Add customer_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'customer_type'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN customer_type VARCHAR(50) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale'));
    END IF;
    
    -- Add delivery_address if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_address TEXT;
    END IF;
    
    -- Add delivery_city if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'delivery_city'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_city VARCHAR(255);
    END IF;
    
    -- Add delivery_method if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'delivery_method'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup'));
    END IF;
    
    -- Add delivery_notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'delivery_notes'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_notes TEXT;
    END IF;
END $$;

-- 4. Add missing columns to sales_order_items if they don't exist
DO $$ 
BEGIN
    -- Add is_external_product if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_order_items' AND column_name = 'is_external_product'
    ) THEN
        ALTER TABLE sales_order_items ADD COLUMN is_external_product BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add external_product_details if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_order_items' AND column_name = 'external_product_details'
    ) THEN
        ALTER TABLE sales_order_items ADD COLUMN external_product_details JSONB;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_order_items' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sales_order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. Create locations table if it doesn't exist
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

-- 6. Create missing tables if they don't exist
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

CREATE TABLE IF NOT EXISTS gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id UUID REFERENCES gift_cards(id),
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    order_id UUID REFERENCES sales_orders(id),
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 7. Insert sample location data
INSERT INTO locations (name, address, phone, manager, status) VALUES
('Main Repair Center', '123 Tech Street, Lagos', '+234 801 234 5678', 'John Doe', 'active'),
('Victoria Island Branch', '456 Business Ave, Victoria Island', '+234 802 345 6789', 'Jane Smith', 'active'),
('Ikeja Service Center', '789 Service Road, Ikeja', '+234 803 456 7890', 'Mike Johnson', 'maintenance'),
('Lekki Express', '321 Express Way, Lekki', '+234 804 567 8901', 'Sarah Wilson', 'active')
ON CONFLICT DO NOTHING;

-- 8. Insert sample loyalty rewards
INSERT INTO loyalty_rewards (name, description, points_cost, discount_percentage, category, tier_required) VALUES
('10% Off Next Purchase', 'Get 10% off your next purchase of any item', 500, 10, 'discount', 'bronze'),
('Free Screen Protector', 'Get a free screen protector with any phone purchase', 300, NULL, 'free_item', 'silver'),
('₦5,000 Cashback', 'Get ₦5,000 cashback on your next purchase', 1000, NULL, 'cashback', 'gold'),
('Priority Service', 'Skip the queue and get priority service', 200, NULL, 'upgrade', 'platinum'),
('25% Off Repair Service', 'Get 25% off any repair service', 800, 25, 'discount', 'gold')
ON CONFLICT DO NOTHING;

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_location_id ON sales_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_customer_id ON loyalty_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_tier ON loyalty_customers(tier);
CREATE INDEX IF NOT EXISTS idx_gift_cards_card_number ON gift_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_gift_cards_is_active ON gift_cards(is_active);

-- 10. Enable RLS on new tables
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- 11. Create basic RLS policies
CREATE POLICY "Users can view loyalty customers" ON loyalty_customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view loyalty rewards" ON loyalty_rewards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view gift cards" ON gift_cards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view tax rates" ON tax_rates FOR SELECT USING (auth.role() = 'authenticated');

-- 12. Update existing sales orders to have a default location
UPDATE sales_orders 
SET location_id = (SELECT id FROM locations WHERE name = 'Main Repair Center' LIMIT 1)
WHERE location_id IS NULL;

-- Success message
SELECT 'POS tables fixed successfully! All missing columns have been added.' as status; 