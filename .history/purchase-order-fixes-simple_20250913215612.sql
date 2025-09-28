-- Purchase Order Database Fixes - Simplified Version
-- Run these commands one by one in your Supabase SQL editor

-- Step 1: Create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Add updated_at column to lats_purchase_order_items
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Create trigger for lats_purchase_order_items
DROP TRIGGER IF EXISTS update_lats_purchase_order_items_updated_at ON lats_purchase_order_items;
CREATE TRIGGER update_lats_purchase_order_items_updated_at
    BEFORE UPDATE ON lats_purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create purchase_order_audit table
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    "user" TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Add indexes for purchase_order_audit
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- Step 6: Enable RLS on purchase_order_audit
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for purchase_order_audit
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
CREATE POLICY "Users can view purchase order audit" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
CREATE POLICY "Users can create purchase order audit" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update purchase order audit" ON purchase_order_audit;
CREATE POLICY "Users can update purchase order audit" ON purchase_order_audit
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete purchase order audit" ON purchase_order_audit;
CREATE POLICY "Users can delete purchase order audit" ON purchase_order_audit
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_audit.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Step 8: Enable RLS on lats_purchase_order_items
ALTER TABLE lats_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for lats_purchase_order_items
DROP POLICY IF EXISTS "Users can view purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can view purchase order items" ON lats_purchase_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can create purchase order items" ON lats_purchase_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can update purchase order items" ON lats_purchase_order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete purchase order items" ON lats_purchase_order_items;
CREATE POLICY "Users can delete purchase order items" ON lats_purchase_order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = lats_purchase_order_items.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );
