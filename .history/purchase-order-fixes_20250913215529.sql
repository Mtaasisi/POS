-- Purchase Order Database Fixes
-- Run these SQL commands in your Supabase SQL editor to fix the purchase order errors

-- 1. Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add updated_at column to lats_purchase_order_items table
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_lats_purchase_order_items_updated_at ON lats_purchase_order_items;
CREATE TRIGGER update_lats_purchase_order_items_updated_at
    BEFORE UPDATE ON lats_purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Create purchase_order_audit table
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    "user" TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add indexes for purchase_order_audit table
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- 6. Enable RLS on purchase_order_audit table
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for purchase_order_audit
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can update purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can delete purchase order audit" ON purchase_order_audit;

CREATE POLICY "Users can view purchase order audit" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create purchase order audit" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update purchase order audit" ON purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete purchase order audit" ON purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- 8. Enable RLS on lats_purchase_order_items table
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for lats_purchase_order_items
DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;

CREATE POLICY "Users can view purchase order items" ON lats_purchase_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create purchase order items" ON lats_purchase_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update purchase order items" ON lats_purchase_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete purchase order items" ON lats_purchase_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- 10. Verify tables exist and are accessible
SELECT 'lats_purchase_orders' as table_name, COUNT(*) as row_count FROM lats_purchase_orders
UNION ALL
SELECT 'lats_purchase_order_items' as table_name, COUNT(*) as row_count FROM lats_purchase_order_items
UNION ALL
SELECT 'purchase_order_payments' as table_name, COUNT(*) as row_count FROM purchase_order_payments
UNION ALL
SELECT 'purchase_order_messages' as table_name, COUNT(*) as row_count FROM purchase_order_messages
UNION ALL
SELECT 'purchase_order_audit' as table_name, COUNT(*) as row_count FROM purchase_order_audit
UNION ALL
SELECT 'purchase_order_quality_checks' as table_name, COUNT(*) as row_count FROM purchase_order_quality_checks;
