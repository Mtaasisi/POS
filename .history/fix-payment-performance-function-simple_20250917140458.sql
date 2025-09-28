-- =====================================================
-- FIX PAYMENT PERFORMANCE FUNCTION - SIMPLE VERSION
-- =====================================================
-- Run this SQL in your Supabase dashboard to fix the missing function

-- 1. Create payment_performance_metrics table if it doesn't exist
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_performance_provider_id ON payment_performance_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_performance_created_at ON payment_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_performance_status ON payment_performance_metrics(status);
CREATE INDEX IF NOT EXISTS idx_payment_performance_transaction ON payment_performance_metrics(transaction_id, transaction_type);

-- 3. Enable RLS
ALTER TABLE payment_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;
CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Grant permissions
GRANT ALL ON payment_performance_metrics TO authenticated;

-- 6. Create the missing record_payment_performance function
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

-- 7. Test the function
SELECT record_payment_performance('Cash', NULL, 'test', 100, 'TZS', 'success', 50, NULL) as test_result;

-- 8. Verify everything was created
SELECT 
    'payment_performance_metrics table' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_performance_metrics' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'record_payment_performance function' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'record_payment_performance' 
        AND routine_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
