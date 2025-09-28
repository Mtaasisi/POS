-- =====================================================
-- FIX MISSING PAYMENT PERFORMANCE FUNCTION
-- =====================================================
-- This script creates the missing record_payment_performance function
-- and ensures all required tables exist

-- Create payment_providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'cash', 'card', 'mobile_money', 'bank_transfer'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    provider_code VARCHAR(20) UNIQUE, -- 'CASH', 'CARD', 'MPESA', 'CRDB'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment providers
INSERT INTO payment_providers (name, type, provider_code, description) VALUES
('Cash', 'cash', 'CASH', 'Physical cash payments'),
('Card', 'card', 'CARD', 'Credit/Debit card payments'),
('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments'),
('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments')
ON CONFLICT (name) DO NOTHING;

-- Create payment_performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
    transaction_id UUID, -- Links to customer_payments or purchase_order_payments
    transaction_type VARCHAR(50) NOT NULL, -- 'customer_payment', 'purchase_order_payment'
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'pending', 'cancelled'
    response_time_ms INTEGER, -- Response time in milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_performance_provider_id ON payment_performance_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_performance_created_at ON payment_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_performance_status ON payment_performance_metrics(status);
CREATE INDEX IF NOT EXISTS idx_payment_performance_transaction ON payment_performance_metrics(transaction_id, transaction_type);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_providers;
CREATE POLICY "Enable all access for authenticated users" ON payment_providers
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;
CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON payment_providers TO authenticated;
GRANT ALL ON payment_performance_metrics TO authenticated;

-- Create the missing record_payment_performance function
CREATE OR REPLACE FUNCTION record_payment_performance(
    provider_name_param VARCHAR(100),
    transaction_id_param UUID,
    transaction_type_param VARCHAR(50),
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    status_param VARCHAR(20),
    response_time_ms_param INTEGER DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    provider_id_val UUID;
BEGIN
    -- Get provider ID
    SELECT id INTO provider_id_val
    FROM payment_providers 
    WHERE name = provider_name_param;
    
    IF NOT FOUND THEN
        -- Create provider if it doesn't exist
        INSERT INTO payment_providers (name, type, provider_code)
        VALUES (provider_name_param, 'unknown', UPPER(provider_name_param))
        RETURNING id INTO provider_id_val;
    END IF;
    
    -- Insert performance metric
    INSERT INTO payment_performance_metrics (
        provider_id,
        transaction_id,
        transaction_type,
        amount,
        currency,
        status,
        response_time_ms,
        error_message
    ) VALUES (
        provider_id_val,
        transaction_id_param,
        transaction_type_param,
        amount_param,
        currency_param,
        status_param,
        response_time_ms_param,
        error_message_param
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to record payment performance: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'record_payment_performance' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ record_payment_performance function created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create record_payment_performance function';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_providers' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ payment_providers table exists';
    ELSE
        RAISE NOTICE '❌ payment_providers table missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_performance_metrics' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ payment_performance_metrics table exists';
    ELSE
        RAISE NOTICE '❌ payment_performance_metrics table missing';
    END IF;
END $$;
