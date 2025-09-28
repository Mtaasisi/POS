-- =====================================================
-- COMPLETE PAYMENT PERFORMANCE FIX
-- =====================================================
-- This script fixes the payment_providers table structure and creates the missing function

-- Step 1: Fix payment_providers table structure
DO $$
BEGIN
    -- Add provider_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'provider_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN provider_code VARCHAR(20) UNIQUE;
        RAISE NOTICE 'Added provider_code column';
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Step 2: Insert default payment providers
INSERT INTO payment_providers (name, type, provider_code, description, status) VALUES
('Cash', 'cash', 'CASH', 'Physical cash payments', 'active'),
('Card', 'card', 'CARD', 'Credit/Debit card payments', 'active'),
('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments', 'active'),
('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments', 'active')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Create payment_performance_metrics table
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

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_performance_provider_id ON payment_performance_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_performance_created_at ON payment_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_performance_status ON payment_performance_metrics(status);
CREATE INDEX IF NOT EXISTS idx_payment_performance_transaction ON payment_performance_metrics(transaction_id, transaction_type);

-- Step 5: Enable RLS and create policies
ALTER TABLE payment_performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;
CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Grant permissions
GRANT ALL ON payment_performance_metrics TO authenticated;

-- Step 7: Create the record_payment_performance function
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

-- Step 8: Test the function
SELECT record_payment_performance('Cash', NULL, 'test', 100, 'TZS', 'success', 50, NULL) as test_result;

-- Step 9: Verify everything was created successfully
SELECT 
    'payment_providers table' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_providers' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
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

-- Step 10: Show final table structures
SELECT 'payment_providers columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_providers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'payment_performance_metrics columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_performance_metrics' 
AND table_schema = 'public'
ORDER BY ordinal_position;
