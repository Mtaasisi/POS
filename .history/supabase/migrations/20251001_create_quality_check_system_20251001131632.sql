-- =====================================================
-- CREATE COMPREHENSIVE QUALITY CHECK SYSTEM
-- =====================================================
-- This migration creates the full quality check system with templates

-- =====================================================
-- 1. QUALITY CHECK TEMPLATES TABLE
-- =====================================================

-- Drop the constraint if it exists to allow any category
DO $$ 
BEGIN
    ALTER TABLE quality_check_templates DROP CONSTRAINT IF EXISTS quality_check_templates_category_check;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Table doesn't exist yet, that's fine
END $$;

CREATE TABLE IF NOT EXISTS quality_check_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. QUALITY CHECK CRITERIA TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quality_check_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES quality_check_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PURCHASE ORDER QUALITY CHECKS TABLE (Enhanced)
-- =====================================================

-- Drop and recreate with enhanced schema
DROP TABLE IF EXISTS purchase_order_quality_checks CASCADE;

CREATE TABLE purchase_order_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    template_id UUID REFERENCES quality_check_templates(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'partial')),
    overall_result VARCHAR(50) CHECK (overall_result IN ('pass', 'fail', 'conditional')),
    checked_by UUID REFERENCES auth.users(id),
    checked_at TIMESTAMPTZ,
    notes TEXT,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. QUALITY CHECK ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_order_quality_check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quality_check_id UUID NOT NULL REFERENCES purchase_order_quality_checks(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES quality_check_criteria(id),
    criteria_name VARCHAR(255) NOT NULL,
    result VARCHAR(50) CHECK (result IN ('pass', 'fail', 'na')),
    quantity_checked INTEGER DEFAULT 0,
    quantity_passed INTEGER DEFAULT 0,
    quantity_failed INTEGER DEFAULT 0,
    defect_type VARCHAR(100),
    defect_description TEXT,
    action_taken VARCHAR(50) CHECK (action_taken IN ('accept', 'reject', 'return', 'replace', 'repair')),
    notes TEXT,
    checked_by UUID REFERENCES auth.users(id),
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quality_check_templates_active ON quality_check_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_check_templates_category ON quality_check_templates(category);

CREATE INDEX IF NOT EXISTS idx_quality_check_criteria_template ON quality_check_criteria(template_id);
CREATE INDEX IF NOT EXISTS idx_quality_check_criteria_sort ON quality_check_criteria(template_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_po_quality_checks_order_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_checks_template ON purchase_order_quality_checks(template_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_checks_status ON purchase_order_quality_checks(status);

CREATE INDEX IF NOT EXISTS idx_po_quality_check_items_check_id ON purchase_order_quality_check_items(quality_check_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_check_items_po_item ON purchase_order_quality_check_items(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_check_items_criteria ON purchase_order_quality_check_items(criteria_id);

-- =====================================================
-- 6. ENABLE RLS
-- =====================================================

ALTER TABLE quality_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_check_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_check_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can view quality check templates" ON quality_check_templates;
DROP POLICY IF EXISTS "Authenticated users can create quality check templates" ON quality_check_templates;
DROP POLICY IF EXISTS "Authenticated users can view quality check criteria" ON quality_check_criteria;
DROP POLICY IF EXISTS "Authenticated users can view quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Authenticated users can create quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Authenticated users can update quality checks" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Authenticated users can view quality check items" ON purchase_order_quality_check_items;
DROP POLICY IF EXISTS "Authenticated users can create quality check items" ON purchase_order_quality_check_items;
DROP POLICY IF EXISTS "Authenticated users can update quality check items" ON purchase_order_quality_check_items;

-- Quality Check Templates - All authenticated users can view
CREATE POLICY "Authenticated users can view quality check templates"
    ON quality_check_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create quality check templates"
    ON quality_check_templates FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Quality Check Criteria - All authenticated users can view
CREATE POLICY "Authenticated users can view quality check criteria"
    ON quality_check_criteria FOR SELECT
    TO authenticated
    USING (true);

-- Purchase Order Quality Checks
CREATE POLICY "Authenticated users can view quality checks"
    ON purchase_order_quality_checks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create quality checks"
    ON purchase_order_quality_checks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update quality checks"
    ON purchase_order_quality_checks FOR UPDATE
    TO authenticated
    USING (true);

-- Purchase Order Quality Check Items
CREATE POLICY "Authenticated users can view quality check items"
    ON purchase_order_quality_check_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create quality check items"
    ON purchase_order_quality_check_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update quality check items"
    ON purchase_order_quality_check_items FOR UPDATE
    TO authenticated
    USING (true);

-- =====================================================
-- 8. CREATE RPC FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_quality_check_from_template;

-- Create the RPC function
CREATE OR REPLACE FUNCTION create_quality_check_from_template(
    p_purchase_order_id UUID,
    p_template_id UUID,
    p_checked_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_quality_check_id UUID;
    v_criteria_record RECORD;
    v_po_item_record RECORD;
BEGIN
    -- Create the quality check record
    INSERT INTO purchase_order_quality_checks (
        purchase_order_id,
        template_id,
        status,
        checked_by,
        created_at,
        updated_at
    ) VALUES (
        p_purchase_order_id,
        p_template_id,
        'pending',
        p_checked_by,
        NOW(),
        NOW()
    ) RETURNING id INTO v_quality_check_id;

    -- Get all purchase order items for this PO
    FOR v_po_item_record IN 
        SELECT id FROM lats_purchase_order_items 
        WHERE purchase_order_id = p_purchase_order_id
    LOOP
        -- For each item, create quality check items based on template criteria
        FOR v_criteria_record IN 
            SELECT id, name 
            FROM quality_check_criteria 
            WHERE template_id = p_template_id
            ORDER BY sort_order
        LOOP
            INSERT INTO purchase_order_quality_check_items (
                quality_check_id,
                purchase_order_item_id,
                criteria_id,
                criteria_name,
                result,
                quantity_checked,
                quantity_passed,
                quantity_failed,
                created_at
            ) VALUES (
                v_quality_check_id,
                v_po_item_record.id,
                v_criteria_record.id,
                v_criteria_record.name,
                'na', -- Default to not applicable
                0,
                0,
                0,
                NOW()
            );
        END LOOP;
    END LOOP;

    RETURN v_quality_check_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create quality check: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_quality_check_from_template TO authenticated;

-- =====================================================
-- 9. INSERT DEFAULT TEMPLATES
-- =====================================================

-- Insert default quality check templates
INSERT INTO quality_check_templates (id, name, description, category, is_active) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Standard Quality Check', 'Basic quality inspection for all incoming products', 'General', true),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Electronics Quality Check', 'Detailed inspection for electronic products', 'Electronics', true),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Phone Quality Check', 'Comprehensive quality check for mobile phones', 'Electronics', true)
ON CONFLICT (id) DO NOTHING;

-- Insert criteria for Standard Quality Check
INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Physical Condition', 'Check for any physical damage or defects', true, 1),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Packaging', 'Verify packaging is intact and undamaged', true, 2),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Quantity Verification', 'Confirm quantity matches order', true, 3),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Documentation', 'Check all required documents are included', false, 4)
ON CONFLICT DO NOTHING;

-- Insert criteria for Electronics Quality Check
INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Physical Inspection', 'Check for physical damage, scratches, dents', true, 1),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Power On Test', 'Device powers on successfully', true, 2),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Serial Number Verification', 'Verify and record serial numbers', true, 3),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Accessories Check', 'All accessories included (cables, adapters, manuals)', true, 4),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Warranty Documentation', 'Warranty cards and documentation present', false, 5)
ON CONFLICT DO NOTHING;

-- Insert criteria for Phone Quality Check
INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Box Seal', 'Original box seal intact', true, 1),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Physical Condition', 'No scratches, dents, or damage', true, 2),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'IMEI Verification', 'IMEI matches documentation', true, 3),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Screen Test', 'Screen displays properly, no dead pixels', true, 4),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Touch Response', 'Touch screen responds correctly', true, 5),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Buttons Test', 'All physical buttons work', true, 6),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Camera Test', 'Front and rear cameras functional', true, 7),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Accessories', 'Charger, cable, earphones included', true, 8),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Battery Health', 'Battery health check (if applicable)', false, 9)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON FUNCTION create_quality_check_from_template IS 'Creates a quality check from a template for a purchase order. Automatically creates quality check items for each PO item based on template criteria.';

-- =====================================================
-- CREATE COMPLETE QUALITY CHECK FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS complete_quality_check;

-- Create the complete quality check function
CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
    v_overall_result VARCHAR(50);
BEGIN
    -- Count total items
    SELECT COUNT(*) INTO v_total_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;

    -- Count passed items
    SELECT COUNT(*) INTO v_passed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id
    AND result = 'pass';

    -- Count failed items
    SELECT COUNT(*) INTO v_failed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id
    AND result = 'fail';

    -- Determine overall result
    IF v_failed_items = 0 THEN
        v_overall_result := 'pass';
    ELSIF v_passed_items = 0 THEN
        v_overall_result := 'fail';
    ELSE
        v_overall_result := 'conditional';
    END IF;

    -- Update the quality check
    UPDATE purchase_order_quality_checks
    SET 
        status = 'passed',
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = COALESCE(p_notes, notes),
        signature = COALESCE(p_signature, signature),
        updated_at = NOW()
    WHERE id = p_quality_check_id;

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to complete quality check: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_quality_check TO authenticated;

COMMENT ON FUNCTION complete_quality_check IS 'Completes a quality check by calculating overall results and updating the status.';

-- =====================================================
-- CREATE GET QUALITY CHECK SUMMARY FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_quality_check_summary;

-- Create the get quality check summary function
CREATE OR REPLACE FUNCTION get_quality_check_summary(
    p_purchase_order_id UUID
)
RETURNS TABLE (
    total_checks INTEGER,
    completed_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    conditional_checks INTEGER,
    pending_checks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_checks,
        COUNT(*) FILTER (WHERE status IN ('passed', 'failed', 'partial'))::INTEGER AS completed_checks,
        COUNT(*) FILTER (WHERE overall_result = 'pass')::INTEGER AS passed_checks,
        COUNT(*) FILTER (WHERE overall_result = 'fail')::INTEGER AS failed_checks,
        COUNT(*) FILTER (WHERE overall_result = 'conditional')::INTEGER AS conditional_checks,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_checks
    FROM purchase_order_quality_checks
    WHERE purchase_order_id = p_purchase_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_quality_check_summary TO authenticated;

COMMENT ON FUNCTION get_quality_check_summary IS 'Returns a summary of quality checks for a purchase order.';

-- =====================================================
-- CREATE RECEIVE QUALITY CHECKED ITEMS FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS receive_quality_checked_items;

-- Create the receive quality checked items function
CREATE OR REPLACE FUNCTION receive_quality_checked_items(
    p_quality_check_id UUID,
    p_purchase_order_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_po_item_record RECORD;
    v_item_record RECORD;
    v_total_passed INTEGER;
BEGIN
    -- For each purchase order item that passed quality check
    FOR v_po_item_record IN 
        SELECT DISTINCT poi.id, poi.product_id, poi.variant_id, poi.quantity, poi.cost_price
        FROM lats_purchase_order_items poi
        WHERE poi.purchase_order_id = p_purchase_order_id
    LOOP
        -- Get total passed quantity for this item
        SELECT COALESCE(SUM(quantity_passed), 0) INTO v_total_passed
        FROM purchase_order_quality_check_items
        WHERE quality_check_id = p_quality_check_id
        AND purchase_order_item_id = v_po_item_record.id
        AND result = 'pass';

        -- Update received quantity
        IF v_total_passed > 0 THEN
            UPDATE lats_purchase_order_items
            SET 
                received_quantity = COALESCE(received_quantity, 0) + v_total_passed,
                updated_at = NOW()
            WHERE id = v_po_item_record.id;

            -- Create inventory adjustment
            INSERT INTO lats_inventory_adjustments (
                purchase_order_id,
                product_id,
                variant_id,
                adjustment_type,
                quantity,
                cost_price,
                reason,
                reference_id,
                processed_by,
                created_at
            ) VALUES (
                p_purchase_order_id,
                v_po_item_record.product_id,
                v_po_item_record.variant_id,
                'receive',
                v_total_passed,
                v_po_item_record.cost_price,
                'Received from quality check',
                v_po_item_record.id,
                p_user_id,
                NOW()
            );
        END IF;
    END LOOP;

    -- Update purchase order status
    UPDATE lats_purchase_orders
    SET 
        status = 'received',
        received_date = NOW(),
        updated_at = NOW()
    WHERE id = p_purchase_order_id;

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to receive quality checked items: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION receive_quality_checked_items TO authenticated;

COMMENT ON FUNCTION receive_quality_checked_items IS 'Receives items that have passed quality checks and updates inventory.';

