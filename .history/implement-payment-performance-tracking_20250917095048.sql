-- =====================================================
-- IMPLEMENT REAL PAYMENT PERFORMANCE TRACKING
-- =====================================================

-- Create payment_providers table with real provider data
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

-- Insert real payment providers based on your finance accounts
INSERT INTO payment_providers (name, type, provider_code, description) VALUES
('Cash', 'cash', 'CASH', 'Physical cash payments'),
('Card', 'card', 'CARD', 'Credit/Debit card payments'),
('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments'),
('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments')
ON CONFLICT (name) DO NOTHING;

-- Create payment_performance_metrics table for tracking real metrics
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
CREATE POLICY "Enable all access for authenticated users" ON payment_providers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON payment_providers TO authenticated;
GRANT ALL ON payment_performance_metrics TO authenticated;

-- Function to record payment performance metrics
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

-- Function to get real performance metrics for a provider
CREATE OR REPLACE FUNCTION get_payment_provider_performance(
    provider_name_param VARCHAR(100),
    days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    provider_name VARCHAR(100),
    total_transactions BIGINT,
    successful_transactions BIGINT,
    failed_transactions BIGINT,
    success_rate DECIMAL(5,2),
    average_response_time DECIMAL(8,2),
    total_amount DECIMAL(15,2),
    uptime_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.name as provider_name,
        COUNT(pm.id) as total_transactions,
        COUNT(CASE WHEN pm.status = 'success' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN pm.status = 'failed' THEN 1 END) as failed_transactions,
        CASE 
            WHEN COUNT(pm.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN pm.status = 'success' THEN 1 END)::DECIMAL / COUNT(pm.id)::DECIMAL) * 100, 2)
            ELSE 0 
        END as success_rate,
        CASE 
            WHEN COUNT(pm.response_time_ms) > 0 THEN 
                ROUND(AVG(pm.response_time_ms), 2)
            ELSE 0 
        END as average_response_time,
        COALESCE(SUM(pm.amount), 0) as total_amount,
        CASE 
            WHEN COUNT(pm.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN pm.status IN ('success', 'pending') THEN 1 END)::DECIMAL / COUNT(pm.id)::DECIMAL) * 100, 2)
            ELSE 0 
        END as uptime_percentage
    FROM payment_providers pp
    LEFT JOIN payment_performance_metrics pm ON pp.id = pm.provider_id
        AND pm.created_at >= NOW() - INTERVAL '%s days' % days_back
    WHERE pp.name = provider_name_param
    GROUP BY pp.id, pp.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all providers performance summary
CREATE OR REPLACE FUNCTION get_all_payment_providers_performance(
    days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    provider_name VARCHAR(100),
    provider_type VARCHAR(50),
    provider_status VARCHAR(20),
    total_transactions BIGINT,
    successful_transactions BIGINT,
    failed_transactions BIGINT,
    success_rate DECIMAL(5,2),
    average_response_time DECIMAL(8,2),
    total_amount DECIMAL(15,2),
    uptime_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.name as provider_name,
        pp.type as provider_type,
        pp.status as provider_status,
        COUNT(pm.id) as total_transactions,
        COUNT(CASE WHEN pm.status = 'success' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN pm.status = 'failed' THEN 1 END) as failed_transactions,
        CASE 
            WHEN COUNT(pm.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN pm.status = 'success' THEN 1 END)::DECIMAL / COUNT(pm.id)::DECIMAL) * 100, 2)
            ELSE 0 
        END as success_rate,
        CASE 
            WHEN COUNT(pm.response_time_ms) > 0 THEN 
                ROUND(AVG(pm.response_time_ms), 2)
            ELSE 0 
        END as average_response_time,
        COALESCE(SUM(pm.amount), 0) as total_amount,
        CASE 
            WHEN COUNT(pm.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN pm.status IN ('success', 'pending') THEN 1 END)::DECIMAL / COUNT(pm.id)::DECIMAL) * 100, 2)
            ELSE 0 
        END as uptime_percentage
    FROM payment_providers pp
    LEFT JOIN payment_performance_metrics pm ON pp.id = pm.provider_id
        AND pm.created_at >= NOW() - INTERVAL '%s days' % days_back
    GROUP BY pp.id, pp.name, pp.type, pp.status
    ORDER BY pp.name;
END;
$$ LANGUAGE plpgsql;
