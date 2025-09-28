-- Fix Payment Performance RLS Issues
-- This script fixes the Row Level Security policies for payment performance tables

-- =====================================================
-- FIX RLS POLICIES FOR PAYMENT PERFORMANCE TABLES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_providers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_performance_metrics;

-- Create more permissive RLS policies for payment performance tables
CREATE POLICY "Enable all access for authenticated users" ON payment_providers
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON payment_providers TO authenticated;
GRANT ALL ON payment_performance_metrics TO authenticated;

-- Verify the policies were created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_providers' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        RAISE NOTICE '✅ RLS policy for payment_providers created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create RLS policy for payment_providers';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_performance_metrics' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        RAISE NOTICE '✅ RLS policy for payment_performance_metrics created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create RLS policy for payment_performance_metrics';
    END IF;
END $$;
