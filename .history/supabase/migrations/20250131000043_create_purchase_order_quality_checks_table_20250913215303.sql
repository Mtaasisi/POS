-- Create purchase_order_quality_checks table for tracking PO quality checks
-- Migration: 20250131000043_create_purchase_order_quality_checks_table.sql

-- Purchase order quality checks table
CREATE TABLE IF NOT EXISTS purchase_order_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    notes TEXT,
    checked_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_order_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_item_id ON purchase_order_quality_checks(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_timestamp ON purchase_order_quality_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_passed ON purchase_order_quality_checks(passed);

-- RLS Policies
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;

-- Users can view quality checks for their purchase orders
CREATE POLICY "Users can view purchase order quality checks" ON purchase_order_quality_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_quality_checks.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can create quality checks for their purchase orders
CREATE POLICY "Users can create purchase order quality checks" ON purchase_order_quality_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_quality_checks.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can update quality checks for their purchase orders
CREATE POLICY "Users can update purchase order quality checks" ON purchase_order_quality_checks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_quality_checks.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can delete quality checks for their purchase orders
CREATE POLICY "Users can delete purchase order quality checks" ON purchase_order_quality_checks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_quality_checks.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );
