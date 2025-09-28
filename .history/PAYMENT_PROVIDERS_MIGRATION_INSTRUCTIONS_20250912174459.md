# Payment Providers Migration Instructions

## Issue
You're getting a 404 error when trying to PATCH payment provider records because the `payment_providers` table doesn't exist in your database.

## Solution
Run the following SQL in your Supabase dashboard SQL editor:

```sql
-- Create payment providers table
-- Migration: 20250128000000_create_payment_providers_table.sql

-- Payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'mobile_money', 'card', 'bank', 'cash', 'crypto'
    status VARCHAR(50) NOT NULL DEFAULT 'testing', -- 'active', 'inactive', 'testing'
    api_key VARCHAR(500),
    secret_key VARCHAR(500),
    webhook_url VARCHAR(500),
    base_url VARCHAR(500),
    supported_methods JSONB DEFAULT '[]',
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    fee_fixed DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TZS',
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2) DEFAULT 1000000,
    daily_limit DECIMAL(15,2) DEFAULT 10000000,
    features JSONB DEFAULT '[]',
    last_tested TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(50), -- 'success', 'failed', 'pending'
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time DECIMAL(8,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    uptime DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment reconciliation table
CREATE TABLE IF NOT EXISTS payment_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'reconciled', 'pending', 'discrepancy'
    expected DECIMAL(12,2) DEFAULT 0,
    actual DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) DEFAULT 0,
    source VARCHAR(50) NOT NULL, -- 'device_payment', 'pos_sale', 'combined'
    details JSONB DEFAULT '{}', -- Store devicePayments, posSales, fees, refunds
    discrepancies JSONB DEFAULT '[]', -- Array of discrepancy objects
    reconciled_by VARCHAR(255),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_providers_status ON payment_providers(status);
CREATE INDEX IF NOT EXISTS idx_payment_providers_type ON payment_providers(type);
CREATE INDEX IF NOT EXISTS idx_payment_providers_created_at ON payment_providers(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_date ON payment_reconciliation(date);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_status ON payment_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_source ON payment_reconciliation(source);

-- RLS Policies
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reconciliation ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage payment providers" ON payment_providers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage payment reconciliation" ON payment_reconciliation
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default payment providers
INSERT INTO payment_providers (name, type, status, supported_methods, fee_percentage, fee_fixed, currency, min_amount, max_amount, daily_limit, features, test_status, success_rate, average_response_time, total_transactions, uptime) VALUES
('M-Pesa', 'mobile_money', 'active', '["M-Pesa", "M-Pesa STK Push"]', 1.5, 0, 'TZS', 100, 1000000, 10000000, '["STK Push", "B2C", "C2B"]', 'success', 98.5, 2.3, 15420, 99.9),
('Airtel Money', 'mobile_money', 'active', '["Airtel Money"]', 1.2, 0, 'TZS', 100, 500000, 5000000, '["Mobile Money", "B2C"]', 'success', 97.8, 2.8, 8930, 99.7),
('Beem Africa', 'card', 'testing', '["Card", "Mobile Money", "Bank Transfer"]', 2.5, 50, 'TZS', 100, 2000000, 20000000, '["Card Processing", "Mobile Money", "Bank Transfer", "USSD"]', 'pending', 0, 0, 0, 0),
('Cash', 'cash', 'active', '["Cash"]', 0, 0, 'TZS', 0, 999999999, 999999999, '["Cash Payment"]', 'success', 100, 0, 0, 100),
('Bank Transfer', 'bank', 'active', '["Bank Transfer"]', 0.5, 0, 'TZS', 1000, 5000000, 50000000, '["Bank Transfer", "RTGS"]', 'success', 99.2, 5.0, 2340, 99.5);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payment_providers_updated_at BEFORE UPDATE ON payment_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_reconciliation_updated_at BEFORE UPDATE ON payment_reconciliation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Steps to Apply

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL above
4. Click "Run" to execute the migration
5. Verify the tables were created successfully

## Verification

After running the migration, you can verify it worked by running this query:

```sql
SELECT id, name, type, status FROM payment_providers LIMIT 5;
```

You should see the 5 default payment providers that were inserted.

## Next Steps

Once the migration is applied, your PATCH operations to the `payment_providers` table should work correctly.
