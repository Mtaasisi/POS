-- Create purchase_order_audit table for tracking PO audit history
-- Migration: 20250131000042_create_purchase_order_audit_table.sql

-- Purchase order audit table
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- RLS Policies
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Users can view audit history for their purchase orders
CREATE POLICY "Users can view purchase order audit" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can create audit entries for their purchase orders
CREATE POLICY "Users can create purchase order audit" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can update audit entries for their purchase orders
CREATE POLICY "Users can update purchase order audit" ON purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can delete audit entries for their purchase orders
CREATE POLICY "Users can delete purchase order audit" ON purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );
