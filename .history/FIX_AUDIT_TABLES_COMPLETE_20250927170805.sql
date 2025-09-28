-- Complete fix for audit table issues
-- This fixes both 401 Unauthorized and 400 Bad Request errors

-- 1. Fix lats_purchase_order_audit table RLS policies
-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON lats_purchase_order_audit;

CREATE POLICY "Users can create audit records for their purchase orders" ON lats_purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- 2. Ensure purchase_order_audit table has correct schema and policies
-- Drop and recreate with consistent schema
DROP TABLE IF EXISTS purchase_order_audit CASCADE;

CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);

-- Enable RLS
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;

CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON purchase_order_audit TO authenticated;
GRANT SELECT, INSERT ON lats_purchase_order_audit TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
