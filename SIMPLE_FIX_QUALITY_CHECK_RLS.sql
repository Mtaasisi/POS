-- =====================================================
-- SIMPLE FIX FOR QUALITY CHECK RLS POLICIES
-- =====================================================
-- This script fixes RLS policies for purchase_order_quality_checks
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. DROP EXISTING POLICIES (Simple approach)
-- =====================================================

-- Drop policies one by one (safer approach)
DROP POLICY IF EXISTS "Users can view purchase order quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can create purchase order quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can update purchase order quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can delete purchase order quality checks" ON purchase_order_quality_checks;

-- Also drop any policies with different naming patterns
DROP POLICY IF EXISTS "Users can view quality checks for their purchase orders" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can create quality checks for their purchase orders" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can update quality checks for their purchase orders" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Users can delete quality checks for their purchase orders" ON purchase_order_quality_checks;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

-- Enable RLS on the table
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE NEW POLICIES
-- =====================================================

-- Policy 1: Users can view quality checks for their purchase orders
CREATE POLICY "quality_checks_select_policy" 
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
CREATE POLICY "quality_checks_insert_policy" 
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
CREATE POLICY "quality_checks_update_policy" 
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
CREATE POLICY "quality_checks_delete_policy" 
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
-- 4. VERIFY POLICIES
-- =====================================================

-- Check the new policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'purchase_order_quality_checks'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policies for purchase_order_quality_checks created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Policies created:';
    RAISE NOTICE '   • quality_checks_select_policy';
    RAISE NOTICE '   • quality_checks_insert_policy';
    RAISE NOTICE '   • quality_checks_update_policy';
    RAISE NOTICE '   • quality_checks_delete_policy';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 All policies are based on purchase order ownership (created_by = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 The 401 Unauthorized error should now be resolved!';
END $$;
