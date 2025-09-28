-- =====================================================
-- FIX PAYMENT_PROVIDERS RLS POLICIES
-- =====================================================
-- This script fixes the RLS policies for payment_providers table

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('payment_providers', 'payment_performance_metrics')
AND schemaname = 'public';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('payment_providers', 'payment_performance_metrics')
AND schemaname = 'public';

-- Fix payment_providers RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_providers;
    DROP POLICY IF EXISTS "Enable read access for all users" ON payment_providers;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON payment_providers;
    
    -- Create comprehensive policies for payment_providers
    CREATE POLICY "Enable read access for all users" ON payment_providers
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert access for authenticated users" ON payment_providers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update access for authenticated users" ON payment_providers
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete access for authenticated users" ON payment_providers
        FOR DELETE USING (auth.role() = 'authenticated');
    
    RAISE NOTICE 'Created RLS policies for payment_providers table';
END $$;

-- Fix payment_performance_metrics RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;
    
    -- Create comprehensive policies for payment_performance_metrics
    CREATE POLICY "Enable read access for all users" ON payment_performance_metrics
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert access for authenticated users" ON payment_performance_metrics
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update access for authenticated users" ON payment_performance_metrics
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete access for authenticated users" ON payment_performance_metrics
        FOR DELETE USING (auth.role() = 'authenticated');
    
    RAISE NOTICE 'Created RLS policies for payment_performance_metrics table';
END $$;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('payment_providers', 'payment_performance_metrics')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the function again
SELECT record_payment_performance('Cash', NULL, 'test', 100, 'TZS', 'success', 50, NULL) as test_result;

-- Show the data that was inserted
SELECT 
    pp.name as provider_name,
    ppm.transaction_type,
    ppm.amount,
    ppm.currency,
    ppm.status,
    ppm.response_time_ms,
    ppm.created_at
FROM payment_performance_metrics ppm
JOIN payment_providers pp ON ppm.provider_id = pp.id
ORDER BY ppm.created_at DESC
LIMIT 5;
