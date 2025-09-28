-- =====================================================
-- FIX PAYMENT PROVIDERS - COMPLETE SOLUTION
-- =====================================================

-- 1. First, fix the RLS policies to allow inserts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_providers;
CREATE POLICY "Enable all access for authenticated users" ON payment_providers
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Grant permissions
GRANT ALL ON payment_providers TO authenticated;

-- 3. Insert payment providers (without description column)
INSERT INTO payment_providers (name, type) VALUES
('Cash', 'cash'),
('Card', 'card'),
('M-Pesa', 'mobile_money'),
('CRDB', 'bank_transfer')
ON CONFLICT (name) DO NOTHING;

-- 4. If you want to add description column later, uncomment this:
-- ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS description TEXT;
-- UPDATE payment_providers SET description = 
--   CASE 
--     WHEN name = 'Cash' THEN 'Physical cash payments'
--     WHEN name = 'Card' THEN 'Credit/Debit card payments'
--     WHEN name = 'M-Pesa' THEN 'M-Pesa mobile money payments'
--     WHEN name = 'CRDB' THEN 'CRDB Bank transfer payments'
--   END;

-- 5. Create payment_performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
    transaction_id UUID,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_payment_performance_provider_id ON payment_performance_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_performance_created_at ON payment_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_performance_status ON payment_performance_metrics(status);

-- 7. Enable RLS for performance_metrics
ALTER TABLE payment_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policy for performance_metrics
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;
CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Grant permissions for performance_metrics
GRANT ALL ON payment_performance_metrics TO authenticated;
