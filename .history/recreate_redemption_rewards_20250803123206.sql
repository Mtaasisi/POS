-- Recreate redemption_rewards table properly

-- Create redemption_rewards table
CREATE TABLE redemption_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  discount_amount DECIMAL(10,2),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  category TEXT NOT NULL CHECK (category IN ('repair', 'diagnostic', 'accessory', 'service')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_loyalty_level TEXT CHECK (min_loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  max_uses INTEGER,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create redemption_transactions table
CREATE TABLE redemption_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES redemption_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE redemption_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view redemption rewards" ON redemption_rewards FOR SELECT USING (true);
CREATE POLICY "Users can insert redemption rewards" ON redemption_rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update redemption rewards" ON redemption_rewards FOR UPDATE USING (true);
CREATE POLICY "Users can delete redemption rewards" ON redemption_rewards FOR DELETE USING (true);

CREATE POLICY "Users can view redemption transactions" ON redemption_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert redemption transactions" ON redemption_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update redemption transactions" ON redemption_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete redemption transactions" ON redemption_transactions FOR DELETE USING (true);

-- Create triggers
CREATE TRIGGER update_redemption_rewards_updated_at 
    BEFORE UPDATE ON redemption_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redemption_rewards_category ON redemption_rewards(category);
CREATE INDEX IF NOT EXISTS idx_redemption_rewards_active ON redemption_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_redemption_transactions_customer_id ON redemption_transactions(customer_id);

-- Test the table
SELECT 'redemption_rewards' as table_name, COUNT(*) as record_count FROM redemption_rewards;
SELECT 'redemption_transactions' as table_name, COUNT(*) as record_count FROM redemption_transactions; 