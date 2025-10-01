-- Comprehensive fix for purchase order audit table
-- This ensures the audit table exists with the correct schema

-- =====================================================
-- CREATE OR UPDATE AUDIT TABLE
-- =====================================================

-- Ensure purchase_order_audit table exists with correct schema
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Ensure user_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'user_id') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Ensure created_by column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'created_by') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Ensure timestamp column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'timestamp') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;

-- Create SELECT policy (allow users to view audit entries for their orders)
CREATE POLICY "Users can view audit records for their purchase orders" 
ON purchase_order_audit FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_audit.purchase_order_id 
        AND (created_by = auth.uid() OR auth.uid() IS NOT NULL)
    )
);

-- Create INSERT policy (allow users to create audit entries for their orders)
CREATE POLICY "Users can create audit records for their purchase orders" 
ON purchase_order_audit FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_audit.purchase_order_id 
        AND (created_by = auth.uid() OR auth.uid() IS NOT NULL)
    )
);

-- =====================================================
-- CREATE HELPER FUNCTION FOR AUDIT LOGGING
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS log_purchase_order_audit(UUID, TEXT, TEXT, UUID);

-- Create helper function for logging audit entries
CREATE OR REPLACE FUNCTION log_purchase_order_audit(
    p_purchase_order_id UUID,
    p_action TEXT,
    p_details TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
BEGIN
    -- Use provided user_id or fall back to current user
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Insert audit entry
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by,
        timestamp
    ) VALUES (
        p_purchase_order_id,
        p_action,
        p_details,
        v_user_id,
        v_user_id,
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_purchase_order_audit TO authenticated;

