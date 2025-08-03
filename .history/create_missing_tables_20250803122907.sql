-- Create missing tables that are referenced in TypeScript types

-- Create auth_users table (referenced in types)
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer-care', 'technician')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_remarks table
CREATE TABLE IF NOT EXISTS device_remarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_transitions table
CREATE TABLE IF NOT EXISTS device_transitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_ratings table
CREATE TABLE IF NOT EXISTS device_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  technician_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  manual_device_brand TEXT,
  manual_device_model TEXT,
  manual_device_serial TEXT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  intake_checklist JSONB,
  status TEXT NOT NULL DEFAULT 'under-return-review' CHECK (status IN ('under-return-review', 'return-accepted', 'return-rejected', 'return-resolved', 'return-refunded', 'return-exchanged')),
  attachments JSONB,
  resolution TEXT,
  staff_signature TEXT,
  customer_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purchase_date TIMESTAMP WITH TIME ZONE,
  return_type TEXT CHECK (return_type IN ('refund', 'exchange', 'store-credit')),
  branch TEXT,
  staff_name TEXT,
  contact_confirmed BOOLEAN DEFAULT false,
  accessories JSONB,
  condition_description TEXT,
  customer_reported_issue TEXT,
  staff_observed_issue TEXT,
  customer_satisfaction INTEGER,
  preferred_contact TEXT,
  return_auth_number TEXT,
  return_method TEXT,
  return_shipping_fee TEXT,
  expected_pickup_date TIMESTAMP WITH TIME ZONE,
  geo_location JSONB,
  policy_acknowledged BOOLEAN DEFAULT false,
  device_locked TEXT,
  privacy_wiped BOOLEAN DEFAULT false,
  internal_notes TEXT,
  escalation_required BOOLEAN DEFAULT false,
  additional_docs JSONB,
  refund_amount DECIMAL(10,2),
  exchange_device_id UUID REFERENCES devices(id),
  restocking_fee DECIMAL(10,2),
  refund_method TEXT CHECK (refund_method IN ('cash', 'card', 'transfer', 'store-credit')),
  user_ip TEXT,
  user_location TEXT
);

-- Create return_remarks table
CREATE TABLE IF NOT EXISTS return_remarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'staff' CHECK (type IN ('staff', 'customer', 'system'))
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjusted', 'redeemed', 'expired')),
  reason TEXT NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create redemption_rewards table
CREATE TABLE IF NOT EXISTS redemption_rewards (
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
CREATE TABLE IF NOT EXISTS redemption_transactions (
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

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference TEXT,
  performed_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spare_parts_usage table
CREATE TABLE IF NOT EXISTS spare_parts_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  used_by TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on all new tables
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_usage ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for all new tables
-- (This is a simplified version - you may want to customize these based on your security requirements)

-- Auth users policies
CREATE POLICY "Users can view auth users" ON auth_users FOR SELECT USING (true);
CREATE POLICY "Users can insert auth users" ON auth_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update auth users" ON auth_users FOR UPDATE USING (true);
CREATE POLICY "Users can delete auth users" ON auth_users FOR DELETE USING (true);

-- Device remarks policies
CREATE POLICY "Users can view device remarks" ON device_remarks FOR SELECT USING (true);
CREATE POLICY "Users can insert device remarks" ON device_remarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device remarks" ON device_remarks FOR UPDATE USING (true);
CREATE POLICY "Users can delete device remarks" ON device_remarks FOR DELETE USING (true);

-- Device transitions policies
CREATE POLICY "Users can view device transitions" ON device_transitions FOR SELECT USING (true);
CREATE POLICY "Users can insert device transitions" ON device_transitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device transitions" ON device_transitions FOR UPDATE USING (true);
CREATE POLICY "Users can delete device transitions" ON device_transitions FOR DELETE USING (true);

-- Device ratings policies
CREATE POLICY "Users can view device ratings" ON device_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert device ratings" ON device_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device ratings" ON device_ratings FOR UPDATE USING (true);
CREATE POLICY "Users can delete device ratings" ON device_ratings FOR DELETE USING (true);

-- Returns policies
CREATE POLICY "Users can view returns" ON returns FOR SELECT USING (true);
CREATE POLICY "Users can insert returns" ON returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update returns" ON returns FOR UPDATE USING (true);
CREATE POLICY "Users can delete returns" ON returns FOR DELETE USING (true);

-- Return remarks policies
CREATE POLICY "Users can view return remarks" ON return_remarks FOR SELECT USING (true);
CREATE POLICY "Users can insert return remarks" ON return_remarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update return remarks" ON return_remarks FOR UPDATE USING (true);
CREATE POLICY "Users can delete return remarks" ON return_remarks FOR DELETE USING (true);

-- Points transactions policies
CREATE POLICY "Users can view points transactions" ON points_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert points transactions" ON points_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update points transactions" ON points_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete points transactions" ON points_transactions FOR DELETE USING (true);

-- Redemption rewards policies
CREATE POLICY "Users can view redemption rewards" ON redemption_rewards FOR SELECT USING (true);
CREATE POLICY "Users can insert redemption rewards" ON redemption_rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update redemption rewards" ON redemption_rewards FOR UPDATE USING (true);
CREATE POLICY "Users can delete redemption rewards" ON redemption_rewards FOR DELETE USING (true);

-- Redemption transactions policies
CREATE POLICY "Users can view redemption transactions" ON redemption_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert redemption transactions" ON redemption_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update redemption transactions" ON redemption_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete redemption transactions" ON redemption_transactions FOR DELETE USING (true);

-- Inventory transactions policies
CREATE POLICY "Users can view inventory transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert inventory transactions" ON inventory_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update inventory transactions" ON inventory_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete inventory transactions" ON inventory_transactions FOR DELETE USING (true);

-- Spare parts usage policies
CREATE POLICY "Users can view spare parts usage" ON spare_parts_usage FOR SELECT USING (true);
CREATE POLICY "Users can insert spare parts usage" ON spare_parts_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update spare parts usage" ON spare_parts_usage FOR UPDATE USING (true);
CREATE POLICY "Users can delete spare parts usage" ON spare_parts_usage FOR DELETE USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_returns_updated_at 
    BEFORE UPDATE ON returns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redemption_rewards_updated_at 
    BEFORE UPDATE ON redemption_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_remarks_device_id ON device_remarks(device_id);
CREATE INDEX IF NOT EXISTS idx_device_transitions_device_id ON device_transitions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_ratings_device_id ON device_ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_return_remarks_return_id ON return_remarks(return_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer_id ON points_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemption_rewards_category ON redemption_rewards(category);
CREATE INDEX IF NOT EXISTS idx_redemption_rewards_active ON redemption_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_redemption_transactions_customer_id ON redemption_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_usage_part_id ON spare_parts_usage(spare_part_id);

-- Verify all tables were created
SELECT 
    table_name,
    '✅ CREATED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'auth_users', 'device_remarks', 'device_transitions', 'device_ratings',
        'returns', 'return_remarks', 'points_transactions', 'redemption_rewards',
        'redemption_transactions', 'inventory_transactions', 'spare_parts_usage'
    )
ORDER BY table_name; 