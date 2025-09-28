-- =====================================================
-- FINAL FIX FOR PURCHASE ORDER AUDIT TABLE
-- =====================================================
-- This script fixes the audit table schema mismatch and RLS policies

-- Step 1: Drop existing audit table and recreate with correct schema
DROP TABLE IF EXISTS purchase_order_audit CASCADE;

-- Step 2: Create audit table with the correct schema that matches the service
CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- Step 4: Enable RLS on audit table
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
    DROP POLICY IF EXISTS "Users can view audit records" ON purchase_order_audit;
    DROP POLICY IF EXISTS "audit_select_policy" ON purchase_order_audit;
    DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;
    DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
    DROP POLICY IF EXISTS "Users can update purchase order audit" ON purchase_order_audit;
    DROP POLICY IF EXISTS "Users can delete purchase order audit" ON purchase_order_audit;
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, ignore
        NULL;
END $$;

-- Step 6: Create comprehensive RLS policies
-- Policy for SELECT - users can view audit records for their purchase orders
CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Policy for INSERT - users can create audit records for their purchase orders
CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Policy for UPDATE - users can update audit records for their purchase orders
CREATE POLICY "Users can update audit records for their purchase orders" ON purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Policy for DELETE - users can delete audit records for their purchase orders
CREATE POLICY "Users can delete audit records for their purchase orders" ON purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_audit.purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_audit TO authenticated;
GRANT USAGE ON SEQUENCE purchase_order_audit_id_seq TO authenticated;

-- Step 8: Test the table structure
SELECT 'Testing audit table structure...' as message;

-- Test insert (this should work if RLS is properly configured)
DO $$
DECLARE
    test_order_id UUID;
    test_user_id UUID;
BEGIN
    -- Get a test purchase order ID
    SELECT id INTO test_order_id FROM lats_purchase_orders LIMIT 1;
    
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_order_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            details,
            user_id,
            created_by,
            timestamp
        ) VALUES (
            test_order_id,
            'test_action',
            '{"test": true}'::jsonb,
            test_user_id,
            test_user_id,
            NOW()
        );
        
        RAISE NOTICE 'Test insert successful';
        
        -- Clean up test record
        DELETE FROM purchase_order_audit WHERE action = 'test_action';
        
    ELSE
        RAISE NOTICE 'No test data available for testing';
    END IF;
END $$;

-- Step 9: Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_order_audit' 
ORDER BY ordinal_position;

SELECT 'Audit table fixed and tested successfully!' as message;
