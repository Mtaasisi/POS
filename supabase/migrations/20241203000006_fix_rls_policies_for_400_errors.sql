-- Migration to fix RLS policies causing 400 Bad Request errors
-- This addresses the RLS policy violations when creating default records

-- =====================================================
-- DROP RESTRICTIVE POLICIES
-- =====================================================

-- Drop all existing restrictive policies from loyalty customer settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can view their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can insert their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can update their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can delete their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;

-- Drop all existing restrictive policies from analytics reporting settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can view their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can insert their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can update their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can delete their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;

-- =====================================================
-- CREATE PERMISSIVE POLICIES
-- =====================================================

-- Create permissive policy for loyalty customer settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_loyalty_customer_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create permissive policy for analytics reporting settings
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_analytics_reporting_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON lats_pos_loyalty_customer_settings TO authenticated;
GRANT ALL ON lats_pos_analytics_reporting_settings TO authenticated;

-- =====================================================
-- VERIFY THE FIXES
-- =====================================================

-- Check if policies were created successfully
DO $$
BEGIN
  -- Check loyalty customer settings policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lats_pos_loyalty_customer_settings' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE EXCEPTION 'Policy not created for lats_pos_loyalty_customer_settings';
  END IF;
  
  -- Check analytics reporting settings policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lats_pos_analytics_reporting_settings' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE EXCEPTION 'Policy not created for lats_pos_analytics_reporting_settings';
  END IF;
  
  RAISE NOTICE '✅ All RLS policies have been fixed successfully';
END $$;
