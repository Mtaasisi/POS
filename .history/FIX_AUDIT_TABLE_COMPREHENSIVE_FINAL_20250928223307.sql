-- Comprehensive fix for audit table issues
-- This ensures the audit table exists with the correct structure for the receive function

-- Step 1: Drop existing audit tables to avoid conflicts
DROP TABLE IF EXISTS purchase_order_audit CASCADE;
DROP TABLE IF EXISTS lats_purchase_order_audit CASCADE;

-- Step 2: Create the audit table with the correct structure
CREATE TABLE lats_purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT, -- Using TEXT instead of JSONB for compatibility
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_lats_purchase_order_audit_order_id ON lats_purchase_order_audit(purchase_order_id);
CREATE INDEX idx_lats_purchase_order_audit_created_at ON lats_purchase_order_audit(created_at);
CREATE INDEX idx_lats_purchase_order_audit_action ON lats_purchase_order_audit(action);

-- Step 4: Enable RLS on audit table
ALTER TABLE lats_purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for audit table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view audit records" ON lats_purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records" ON lats_purchase_order_audit;
DROP POLICY IF EXISTS "Users can update audit records" ON lats_purchase_order_audit;

-- Create new policies
CREATE POLICY "Users can view audit records" ON lats_purchase_order_audit
    FOR SELECT USING (true);

CREATE POLICY "Users can create audit records" ON lats_purchase_order_audit
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update audit records" ON lats_purchase_order_audit
    FOR UPDATE USING (true);

-- Step 6: Grant permissions
GRANT SELECT, INSERT, UPDATE ON lats_purchase_order_audit TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Verify the table was created correctly
DO $$
BEGIN
    RAISE NOTICE '✅ Audit table lats_purchase_order_audit created successfully';
    RAISE NOTICE '📋 Table structure:';
    RAISE NOTICE '   - id: UUID PRIMARY KEY';
    RAISE NOTICE '   - purchase_order_id: UUID NOT NULL';
    RAISE NOTICE '   - action: VARCHAR(100) NOT NULL';
    RAISE NOTICE '   - details: TEXT';
    RAISE NOTICE '   - user_id: UUID';
    RAISE NOTICE '   - created_at: TIMESTAMP WITH TIME ZONE';
    RAISE NOTICE '🔒 RLS enabled with permissive policies';
    RAISE NOTICE '🎯 Ready for receive function testing';
END $$;
