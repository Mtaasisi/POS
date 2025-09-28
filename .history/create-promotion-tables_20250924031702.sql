-- Create promotion campaigns table
CREATE TABLE IF NOT EXISTS promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  target_category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  discount INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'completed', 'failed')),
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Create promotion responses table
CREATE TABLE IF NOT EXISTS promotion_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL CHECK (response_type IN ('clicked', 'redeemed', 'ignored', 'unsubscribed')),
  response_data JSONB,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add campaign_id to customer_communications table if it doesn't exist
ALTER TABLE customer_communications 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES promotion_campaigns(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_status ON promotion_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_created_at ON promotion_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_promotion_responses_campaign_id ON promotion_responses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promotion_responses_customer_id ON promotion_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_campaign_id ON customer_communications(campaign_id);

-- Create RLS policies
ALTER TABLE promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_campaigns
CREATE POLICY "Users can view their own promotion campaigns" ON promotion_campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create promotion campaigns" ON promotion_campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own promotion campaigns" ON promotion_campaigns
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own promotion campaigns" ON promotion_campaigns
  FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for promotion_responses
CREATE POLICY "Users can view promotion responses for their campaigns" ON promotion_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM promotion_campaigns 
      WHERE promotion_campaigns.id = promotion_responses.campaign_id 
      AND promotion_campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert promotion responses" ON promotion_responses
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for promotion_campaigns
CREATE TRIGGER update_promotion_campaigns_updated_at 
  BEFORE UPDATE ON promotion_campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to track promotion responses
CREATE OR REPLACE FUNCTION track_promotion_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Update response count in promotion_campaigns
  UPDATE promotion_campaigns 
  SET response_count = response_count + 1,
      updated_at = NOW()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for promotion_responses
CREATE TRIGGER track_promotion_response_trigger
  AFTER INSERT ON promotion_responses
  FOR EACH ROW EXECUTE FUNCTION track_promotion_response();

-- Insert sample promotion templates
INSERT INTO promotion_campaigns (name, target_category, message, discount, status, target_count, created_by) VALUES
('VIP Welcome Campaign', 'highValueCustomers', 'Welcome to our VIP program! Enjoy exclusive 20% discount on all premium services.', 20, 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Re-engagement Campaign', 'inactiveCustomers', 'We miss you! Come back and enjoy 30% off your next purchase.', 30, 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('New Customer Welcome', 'newCustomers', 'Welcome! Get 15% off your first purchase with us.', 15, 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Service Recovery', 'complaintCustomers', 'We apologize for any inconvenience. Please accept this 25% discount.', 25, 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Loyalty Reward', 'loyalCustomers', 'Thank you for your loyalty! Enjoy this special 20% discount.', 20, 'draft', 0, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Create view for promotion analytics
CREATE OR REPLACE VIEW promotion_analytics AS
SELECT 
  pc.id,
  pc.name,
  pc.target_category,
  pc.discount,
  pc.status,
  pc.target_count,
  pc.sent_count,
  pc.response_count,
  CASE 
    WHEN pc.sent_count > 0 THEN ROUND((pc.response_count::DECIMAL / pc.sent_count) * 100, 2)
    ELSE 0 
  END as response_rate,
  pc.created_at,
  pc.scheduled_for,
  COUNT(pr.id) as total_responses,
  COUNT(CASE WHEN pr.response_type = 'redeemed' THEN 1 END) as redeemed_count,
  COUNT(CASE WHEN pr.response_type = 'clicked' THEN 1 END) as clicked_count,
  COUNT(CASE WHEN pr.response_type = 'ignored' THEN 1 END) as ignored_count
FROM promotion_campaigns pc
LEFT JOIN promotion_responses pr ON pc.id = pr.campaign_id
GROUP BY pc.id, pc.name, pc.target_category, pc.discount, pc.status, 
         pc.target_count, pc.sent_count, pc.response_count, pc.created_at, pc.scheduled_for;

-- Grant permissions
GRANT SELECT ON promotion_analytics TO authenticated;
GRANT ALL ON promotion_campaigns TO authenticated;
GRANT ALL ON promotion_responses TO authenticated;
