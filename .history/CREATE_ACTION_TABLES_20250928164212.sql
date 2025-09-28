-- =====================================================
-- PURCHASE ORDER ACTIONS DATABASE TABLES
-- =====================================================
-- This script creates the necessary database tables for
-- the purchase order action buttons functionality.
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. QUALITY CHECKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    notes TEXT,
    checked_by TEXT NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_quality_checks_order_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_item_id ON purchase_order_quality_checks(item_id);

-- =====================================================
-- 2. RETURN ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    return_number TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('defective', 'wrong_item', 'excess', 'damaged', 'other')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    total_amount DECIMAL(15,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON purchase_order_returns(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON purchase_order_returns(status);

-- =====================================================
-- 3. RETURN ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_order_id UUID NOT NULL REFERENCES purchase_order_returns(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON purchase_order_return_items(return_order_id);
CREATE INDEX IF NOT EXISTS idx_return_items_item_id ON purchase_order_return_items(item_id);

-- =====================================================
-- 4. PURCHASE ORDER MESSAGES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'user', 'supplier', 'note')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON purchase_order_messages(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON purchase_order_messages(type);

-- =====================================================
-- 5. PURCHASE ORDER AUDIT TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON purchase_order_audit(action);

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Quality Checks Policies
CREATE POLICY "Users can view quality checks for their purchase orders" ON purchase_order_quality_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create quality checks for their purchase orders" ON purchase_order_quality_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Return Orders Policies
CREATE POLICY "Users can view returns for their purchase orders" ON purchase_order_returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create returns for their purchase orders" ON purchase_order_returns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Return Items Policies
CREATE POLICY "Users can view return items for their purchase orders" ON purchase_order_return_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_order_returns po_return
            JOIN lats_purchase_orders po ON po.id = po_return.purchase_order_id
            WHERE po_return.id = return_order_id 
            AND po.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create return items for their purchase orders" ON purchase_order_return_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_order_returns po_return
            JOIN lats_purchase_orders po ON po.id = po_return.purchase_order_id
            WHERE po_return.id = return_order_id 
            AND po.created_by = auth.uid()
        )
    );

-- Messages Policies (if not already created)
CREATE POLICY IF NOT EXISTS "Users can view messages for their purchase orders" ON purchase_order_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create messages for their purchase orders" ON purchase_order_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Audit Policies (if not already created)
CREATE POLICY IF NOT EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to generate return order number
CREATE OR REPLACE FUNCTION generate_return_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 'RET-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM purchase_order_returns
    WHERE return_number ~ '^RET-\d+$';
    
    -- Format the number
    new_number := 'RET-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate return order numbers
CREATE OR REPLACE FUNCTION auto_generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        NEW.return_number := generate_return_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_return_number
    BEFORE INSERT ON purchase_order_returns
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_return_number();

-- =====================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- You can uncomment this section to add sample data for testing
/*
-- Sample quality check
INSERT INTO purchase_order_quality_checks (purchase_order_id, item_id, passed, notes, checked_by)
SELECT 
    po.id,
    poi.id,
    true,
    'Sample quality check passed',
    'Test User'
FROM lats_purchase_orders po
JOIN lats_purchase_order_items poi ON poi.purchase_order_id = po.id
WHERE po.status = 'received'
LIMIT 1;

-- Sample message/note
INSERT INTO purchase_order_messages (purchase_order_id, sender, content, type)
SELECT 
    id,
    'Test User',
    'Sample note for testing',
    'note'
FROM lats_purchase_orders
WHERE status = 'received'
LIMIT 1;
*/

-- Commit the transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Purchase Order Actions tables created successfully!';
    RAISE NOTICE '📊 Created tables:';
    RAISE NOTICE '  - purchase_order_quality_checks';
    RAISE NOTICE '  - purchase_order_returns';
    RAISE NOTICE '  - purchase_order_return_items';
    RAISE NOTICE '  - purchase_order_messages (if not existed)';
    RAISE NOTICE '  - purchase_order_audit (if not existed)';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '📈 Performance indexes created';
    RAISE NOTICE '🔧 Helper functions created';
END $$;
