-- =====================================================
-- FIX RLS POLICIES FOR QUALITY CHECKS TABLE
-- =====================================================
-- This script fixes Row Level Security policies for purchase_order_quality_checks
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CHECK CURRENT RLS STATUS AND POLICIES
-- =====================================================

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'purchase_order_quality_checks';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchase_order_quality_checks';

-- =====================================================
-- 2. DROP EXISTING POLICIES (if any)
-- =====================================================

-- Drop all existing policies on the table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'purchase_order_quality_checks'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON purchase_order_quality_checks';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- =====================================================
-- 3. CREATE PROPER RLS POLICIES
-- =====================================================

-- Enable RLS on the table
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view quality checks for their purchase orders
CREATE POLICY "Users can view quality checks for their purchase orders" 
ON purchase_order_quality_checks
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders po
        WHERE po.id = purchase_order_quality_checks.purchase_order_id
        AND po.created_by = auth.uid()
    )
);

-- Policy 2: Users can create quality checks for their purchase orders
CREATE POLICY "Users can create quality checks for their purchase orders" 
ON purchase_order_quality_checks
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders po
        WHERE po.id = purchase_order_quality_checks.purchase_order_id
        AND po.created_by = auth.uid()
    )
);

-- Policy 3: Users can update quality checks for their purchase orders
CREATE POLICY "Users can update quality checks for their purchase orders" 
ON purchase_order_quality_checks
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders po
        WHERE po.id = purchase_order_quality_checks.purchase_order_id
        AND po.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders po
        WHERE po.id = purchase_order_quality_checks.purchase_order_id
        AND po.created_by = auth.uid()
    )
);

-- Policy 4: Users can delete quality checks for their purchase orders
CREATE POLICY "Users can delete quality checks for their purchase orders" 
ON purchase_order_quality_checks
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders po
        WHERE po.id = purchase_order_quality_checks.purchase_order_id
        AND po.created_by = auth.uid()
    )
);

-- =====================================================
-- 4. VERIFY POLICIES WERE CREATED
-- =====================================================

-- Check the new policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchase_order_quality_checks'
ORDER BY policyname;

-- =====================================================
-- 5. TEST POLICY WITH SAMPLE DATA
-- =====================================================

-- Check if there are any purchase orders to test with
SELECT 
    'Sample purchase orders for testing' as info,
    id,
    order_number,
    created_by,
    status
FROM lats_purchase_orders 
ORDER BY created_at DESC 
LIMIT 3;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policies for purchase_order_quality_checks created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Policies created:';
    RAISE NOTICE '   • Users can view quality checks for their purchase orders';
    RAISE NOTICE '   • Users can create quality checks for their purchase orders';
    RAISE NOTICE '   • Users can update quality checks for their purchase orders';
    RAISE NOTICE '   • Users can delete quality checks for their purchase orders';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 All policies are based on purchase order ownership (created_by = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 The 401 Unauthorized error should now be resolved!';
END $$;
