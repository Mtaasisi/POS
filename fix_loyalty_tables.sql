-- Fix Loyalty Program Tables
-- This script ensures all loyalty-related tables exist and are properly structured

-- 1. Create loyalty_customers table if it doesn't exist
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

-- 2. Create loyalty_rewards table if it doesn't exist
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

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_customer_id ON loyalty_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_points ON loyalty_customers(points);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_tier ON loyalty_customers(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_is_active ON loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_points_cost ON loyalty_rewards(points_cost);

-- 4. Enable RLS on tables
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view loyalty customers" ON loyalty_customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert loyalty customers" ON loyalty_customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update loyalty customers" ON loyalty_customers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view loyalty rewards" ON loyalty_rewards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert loyalty rewards" ON loyalty_rewards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update loyalty rewards" ON loyalty_rewards FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Insert sample loyalty rewards if they don't exist
INSERT INTO loyalty_rewards (name, description, points_cost, discount_percentage, category, tier_required) VALUES
('10% Off Next Purchase', 'Get 10% off your next purchase of any item', 500, 10, 'discount', 'bronze'),
('Free Screen Protector', 'Get a free screen protector with any phone purchase', 300, NULL, 'free_item', 'silver'),
('₦5,000 Cashback', 'Get ₦5,000 cashback on your next purchase', 1000, NULL, 'cashback', 'gold'),
('Priority Service', 'Skip the queue and get priority service', 200, NULL, 'upgrade', 'platinum'),
('25% Off Repair Service', 'Get 25% off any repair service', 800, 25, 'discount', 'gold')
ON CONFLICT DO NOTHING;

-- 7. Create sample loyalty customers from existing customers (if any exist)
INSERT INTO loyalty_customers (customer_id, points, tier, total_spent, join_date, last_visit, rewards_redeemed)
SELECT 
    c.id,
    FLOOR(RANDOM() * 5000) + 100, -- Random points between 100-5100
    CASE 
        WHEN FLOOR(RANDOM() * 4) = 0 THEN 'bronze'
        WHEN FLOOR(RANDOM() * 4) = 1 THEN 'silver'
        WHEN FLOOR(RANDOM() * 4) = 2 THEN 'gold'
        ELSE 'platinum'
    END,
    FLOOR(RANDOM() * 1000000) + 50000, -- Random spent between 50k-1.05M
    c.created_at,
    NOW(),
    FLOOR(RANDOM() * 10) -- Random rewards redeemed 0-9
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM loyalty_customers lc WHERE lc.customer_id = c.id
)
LIMIT 10;

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_loyalty_customers_updated_at ON loyalty_customers;
CREATE TRIGGER update_loyalty_customers_updated_at
    BEFORE UPDATE ON loyalty_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_rewards_updated_at ON loyalty_rewards;
CREATE TRIGGER update_loyalty_rewards_updated_at
    BEFORE UPDATE ON loyalty_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Loyalty tables fixed successfully! All tables created and sample data inserted.' as status; 