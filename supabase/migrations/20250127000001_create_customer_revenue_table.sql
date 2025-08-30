-- Create customer revenue tracking table (separate migration to avoid conflicts)
CREATE TABLE IF NOT EXISTS customer_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  revenue_type VARCHAR(50) NOT NULL CHECK (revenue_type IN ('device_repair', 'pos_sale', 'service_fee', 'consultation')),
  amount DECIMAL(10,2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id VARCHAR(100),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customer revenue
CREATE INDEX IF NOT EXISTS idx_customer_revenue_customer_id ON customer_revenue(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_type ON customer_revenue(revenue_type);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_date ON customer_revenue(transaction_date);

-- Enable RLS
ALTER TABLE customer_revenue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can view customer revenue') THEN
        CREATE POLICY "Users can view customer revenue" ON customer_revenue FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can insert customer revenue') THEN
        CREATE POLICY "Users can insert customer revenue" ON customer_revenue FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can update customer revenue') THEN
        CREATE POLICY "Users can update customer revenue" ON customer_revenue FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can delete customer revenue') THEN
        CREATE POLICY "Users can delete customer revenue" ON customer_revenue FOR DELETE USING (true);
    END IF;
END $$;
