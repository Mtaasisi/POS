-- Migration to fix RLS policies for customers table and related tables
-- This addresses potential 400 Bad Request errors when fetching customer data

-- =====================================================
-- ENABLE RLS ON CUSTOMER-RELATED TABLES
-- =====================================================

-- Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customer_notes table if not already enabled
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customer_payments table if not already enabled
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on promo_messages table if not already enabled
ALTER TABLE promo_messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on devices table if not already enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- =====================================================

-- Drop existing policies from customers table
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

-- Drop existing policies from customer_notes table
DROP POLICY IF EXISTS "Users can view their own customer notes" ON customer_notes;
DROP POLICY IF EXISTS "Users can insert their own customer notes" ON customer_notes;
DROP POLICY IF EXISTS "Users can update their own customer notes" ON customer_notes;
DROP POLICY IF EXISTS "Users can delete their own customer notes" ON customer_notes;

-- Drop existing policies from customer_payments table
DROP POLICY IF EXISTS "Users can view their own customer payments" ON customer_payments;
DROP POLICY IF EXISTS "Users can insert their own customer payments" ON customer_payments;
DROP POLICY IF EXISTS "Users can update their own customer payments" ON customer_payments;
DROP POLICY IF EXISTS "Users can delete their own customer payments" ON customer_payments;

-- Drop existing policies from promo_messages table
DROP POLICY IF EXISTS "Users can view their own promo messages" ON promo_messages;
DROP POLICY IF EXISTS "Users can insert their own promo messages" ON promo_messages;
DROP POLICY IF EXISTS "Users can update their own promo messages" ON promo_messages;
DROP POLICY IF EXISTS "Users can delete their own promo messages" ON promo_messages;

-- Drop existing policies from devices table
DROP POLICY IF EXISTS "Users can view their own devices" ON devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON devices;

-- =====================================================
-- CREATE PERMISSIVE POLICIES
-- =====================================================

-- Create permissive policies for customers table
CREATE POLICY "Enable all access for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Create permissive policies for customer_notes table
CREATE POLICY "Enable all access for authenticated users" ON customer_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Create permissive policies for customer_payments table
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Create permissive policies for promo_messages table
CREATE POLICY "Enable all access for authenticated users" ON promo_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Create permissive policies for devices table
CREATE POLICY "Enable all access for authenticated users" ON devices
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customer_notes TO authenticated;
GRANT ALL ON customer_payments TO authenticated;
GRANT ALL ON promo_messages TO authenticated;
GRANT ALL ON devices TO authenticated;

-- =====================================================
-- VERIFY THE FIXES
-- =====================================================

-- Check if policies were created successfully
DO $$
BEGIN
  -- Check customers table policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE NOTICE '✅ Customers table policy created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create customers table policy';
  END IF;

  -- Check customer_notes table policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_notes' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE NOTICE '✅ Customer notes table policy created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create customer notes table policy';
  END IF;

  -- Check customer_payments table policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_payments' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE NOTICE '✅ Customer payments table policy created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create customer payments table policy';
  END IF;

  -- Check promo_messages table policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promo_messages' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE NOTICE '✅ Promo messages table policy created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create promo messages table policy';
  END IF;

  -- Check devices table policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'devices' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE NOTICE '✅ Devices table policy created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create devices table policy';
  END IF;

END $$;
