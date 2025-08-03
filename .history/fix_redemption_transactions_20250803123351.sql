-- Fix redemption_transactions table that already exists

-- Drop the existing table and its dependencies
DROP TABLE IF EXISTS redemption_transactions CASCADE;

-- Recreate redemption_transactions table
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
ALTER TABLE redemption_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view redemption transactions" ON redemption_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert redemption transactions" ON redemption_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update redemption transactions" ON redemption_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete redemption transactions" ON redemption_transactions FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redemption_transactions_customer_id ON redemption_transactions(customer_id);

-- Test the table
SELECT 'redemption_transactions' as table_name, COUNT(*) as record_count FROM redemption_transactions; 