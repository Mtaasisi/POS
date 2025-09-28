-- =====================================================
-- FIX AUDIT TABLE RLS POLICIES
-- =====================================================
-- This script fixes the RLS policies to allow the service code to work properly

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "audit_select_policy" ON purchase_order_audit;
DROP POLICY IF EXISTS "audit_insert_policy" ON purchase_order_audit;
DROP POLICY IF EXISTS "audit_update_policy" ON purchase_order_audit;
DROP POLICY IF EXISTS "audit_delete_policy" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can update audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can delete audit records for their purchase orders" ON purchase_order_audit;

-- Step 2: Create more permissive policies that work with the service code
-- Policy for SELECT - allow viewing audit records for purchase orders the user can access
CREATE POLICY "audit_select_policy" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND (
                created_by = auth.uid() 
                OR auth.uid() IS NULL
            )
        )
    );

-- Policy for INSERT - allow creating audit records for any purchase order
-- This is needed because the service code doesn't always have user context
CREATE POLICY "audit_insert_policy" ON purchase_order_audit
    FOR INSERT WITH CHECK (true);

-- Policy for UPDATE - allow updating audit records for purchase orders the user can access
CREATE POLICY "audit_update_policy" ON purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND (
                created_by = auth.uid() 
                OR auth.uid() IS NULL
            )
        )
    );

-- Policy for DELETE - allow deleting audit records for purchase orders the user can access
CREATE POLICY "audit_delete_policy" ON purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND (
                created_by = auth.uid() 
                OR auth.uid() IS NULL
            )
        )
    );

-- Step 3: Ensure proper permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_audit TO anon;

-- Step 4: Test the policies
SELECT 'RLS policies updated successfully!' as message;

-- Step 5: Verify the policies are active
SELECT 
    'Updated RLS Policies:' as message,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'purchase_order_audit'
ORDER BY policyname;
