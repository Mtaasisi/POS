-- =====================================================
-- COMPLETE QUALITY CHECK SYSTEM RECREATION
-- This script recreates a refined quality check system
-- =====================================================

-- =====================================================
-- STEP 1: DROP EXISTING QUALITY CHECK TABLES
-- =====================================================

DROP TABLE IF EXISTS purchase_order_quality_check_items CASCADE;
DROP TABLE IF EXISTS purchase_order_quality_checks CASCADE;
DROP TABLE IF EXISTS quality_check_templates CASCADE;
DROP TABLE IF EXISTS quality_check_criteria CASCADE;

-- =====================================================
-- STEP 2: CREATE QUALITY CHECK TEMPLATES TABLE
-- =====================================================

CREATE TABLE quality_check_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('electronics', 'accessories', 'general', 'custom')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE QUALITY CHECK CRITERIA TABLE
-- =====================================================

CREATE TABLE quality_check_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES quality_check_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE PURCHASE ORDER QUALITY CHECKS TABLE
-- =====================================================

CREATE TABLE purchase_order_quality_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    template_id UUID REFERENCES quality_check_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'partial')),
    overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional')),
    checked_by UUID,
    checked_at TIMESTAMPTZ,
    notes TEXT,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE QUALITY CHECK ITEMS TABLE
-- =====================================================

CREATE TABLE purchase_order_quality_check_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quality_check_id UUID NOT NULL REFERENCES purchase_order_quality_checks(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES quality_check_criteria(id) ON DELETE SET NULL,
    criteria_name TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'na')),
    quantity_checked INTEGER NOT NULL DEFAULT 0,
    quantity_passed INTEGER NOT NULL DEFAULT 0,
    quantity_failed INTEGER NOT NULL DEFAULT 0,
    defect_type TEXT,
    defect_description TEXT,
    action_taken TEXT CHECK (action_taken IN ('accept', 'reject', 'return', 'replace', 'repair')),
    notes TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 6: UPDATE PURCHASE ORDERS TABLE
-- =====================================================

-- Ensure quality check columns exist in purchase orders
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS quality_check_status TEXT DEFAULT 'pending' CHECK (quality_check_status IN ('pending', 'in_progress', 'passed', 'failed', 'partial')),
ADD COLUMN IF NOT EXISTS quality_check_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quality_check_notes TEXT,
ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_check_by UUID,
ADD COLUMN IF NOT EXISTS quality_check_signature TEXT;

-- =====================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_po_quality_checks_po_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_checks_status ON purchase_order_quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_po_quality_checks_checked_by ON purchase_order_quality_checks(checked_by);
CREATE INDEX IF NOT EXISTS idx_po_quality_check_items_qc_id ON purchase_order_quality_check_items(quality_check_id);
CREATE INDEX IF NOT EXISTS idx_po_quality_check_items_po_item_id ON purchase_order_quality_check_items(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_quality_criteria_template_id ON quality_check_criteria(template_id);

-- =====================================================
-- STEP 8: CREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE quality_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_check_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_check_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for quality check tables
CREATE POLICY "quality_check_templates_all" ON quality_check_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "quality_check_criteria_all" ON quality_check_criteria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "purchase_order_quality_checks_all" ON purchase_order_quality_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "purchase_order_quality_check_items_all" ON purchase_order_quality_check_items FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 9: CREATE DEFAULT QUALITY CHECK TEMPLATES
-- =====================================================

-- Electronics Template
INSERT INTO quality_check_templates (id, name, description, category, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Electronics Quality Check',
    'Standard quality check for electronic devices',
    'electronics',
    true
);

-- Insert criteria for electronics template
INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Physical Inspection', 'Check for physical damage, scratches, dents', true, 1),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Power Test', 'Device powers on correctly', true, 2),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Functionality Test', 'All features work as expected', true, 3),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Accessories Check', 'All accessories included and functional', true, 4),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Serial/IMEI Verification', 'Serial number or IMEI matches documentation', true, 5),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Packaging Condition', 'Original packaging intact and undamaged', false, 6),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Documentation', 'Manual and warranty documents included', false, 7);

-- General Template
INSERT INTO quality_check_templates (id, name, description, category, is_active)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'General Quality Check',
    'Standard quality check for general items',
    'general',
    true
);

-- Insert criteria for general template
INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order)
VALUES 
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Visual Inspection', 'Check for visible defects or damage', true, 1),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Quantity Verification', 'Verify quantity matches order', true, 2),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Packaging Integrity', 'Check packaging is intact', true, 3),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Label/SKU Match', 'Labels and SKU match order specifications', true, 4);

-- =====================================================
-- STEP 10: CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to update quality check status on purchase order
CREATE OR REPLACE FUNCTION update_po_quality_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update purchase order quality check status
    UPDATE lats_purchase_orders
    SET 
        quality_check_status = NEW.status,
        quality_check_date = NEW.checked_at,
        quality_check_notes = NEW.notes,
        quality_check_passed = (NEW.overall_result = 'pass'),
        quality_check_by = NEW.checked_by,
        quality_check_signature = NEW.signature,
        updated_at = NOW()
    WHERE id = NEW.purchase_order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_po_quality_status ON purchase_order_quality_checks;
CREATE TRIGGER trg_update_po_quality_status
    AFTER INSERT OR UPDATE ON purchase_order_quality_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_po_quality_status();

-- Function to auto-update quality check status based on items
CREATE OR REPLACE FUNCTION auto_update_quality_check_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
    v_overall_status TEXT;
    v_overall_result TEXT;
BEGIN
    -- Count total items
    SELECT COUNT(*) INTO v_total_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = NEW.quality_check_id;
    
    -- Count passed items
    SELECT COUNT(*) INTO v_passed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = NEW.quality_check_id AND result = 'pass';
    
    -- Count failed items
    SELECT COUNT(*) INTO v_failed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = NEW.quality_check_id AND result = 'fail';
    
    -- Determine overall status and result
    IF v_failed_items = 0 AND v_passed_items = v_total_items THEN
        v_overall_status := 'passed';
        v_overall_result := 'pass';
    ELSIF v_failed_items > 0 AND v_passed_items > 0 THEN
        v_overall_status := 'partial';
        v_overall_result := 'conditional';
    ELSIF v_failed_items > 0 THEN
        v_overall_status := 'failed';
        v_overall_result := 'fail';
    ELSE
        v_overall_status := 'in_progress';
        v_overall_result := NULL;
    END IF;
    
    -- Update quality check (using v_ prefix to avoid ambiguity)
    UPDATE purchase_order_quality_checks
    SET 
        status = v_overall_status,
        overall_result = v_overall_result,
        updated_at = NOW()
    WHERE id = NEW.quality_check_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_update_quality_check_status ON purchase_order_quality_check_items;
CREATE TRIGGER trg_auto_update_quality_check_status
    AFTER INSERT OR UPDATE ON purchase_order_quality_check_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_quality_check_status();

-- =====================================================
-- STEP 11: CREATE HELPER FUNCTIONS
-- =====================================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS create_quality_check_from_template(UUID, UUID, UUID);

-- Drop all versions of complete_quality_check function
DO $$
BEGIN
    DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT, TEXT);
    DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT);
    DROP FUNCTION IF EXISTS complete_quality_check(UUID);
EXCEPTION
    WHEN OTHERS THEN
        -- If specific drops fail, try dropping by name with CASCADE
        EXECUTE 'DROP FUNCTION IF EXISTS complete_quality_check CASCADE';
END $$;

-- Function to create quality check from template
CREATE OR REPLACE FUNCTION create_quality_check_from_template(
    p_purchase_order_id UUID,
    p_template_id UUID,
    p_checked_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_quality_check_id UUID;
    v_item RECORD;
    v_criteria RECORD;
BEGIN
    -- Create quality check
    INSERT INTO purchase_order_quality_checks (
        purchase_order_id,
        template_id,
        status,
        checked_by,
        checked_at
    )
    VALUES (
        p_purchase_order_id,
        p_template_id,
        'in_progress',
        p_checked_by,
        NOW()
    )
    RETURNING id INTO v_quality_check_id;
    
    -- Create quality check items for each PO item and criteria
    FOR v_item IN 
        SELECT id, quantity 
        FROM lats_purchase_order_items 
        WHERE purchase_order_id = p_purchase_order_id
    LOOP
        FOR v_criteria IN 
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
                quantity_checked
            )
            VALUES (
                v_quality_check_id,
                v_item.id,
                v_criteria.id,
                v_criteria.name,
                'na',
                0
            );
        END LOOP;
    END LOOP;
    
    RETURN v_quality_check_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete quality check
CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_overall_result TEXT;
BEGIN
    -- Get overall result
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN result = 'fail' THEN 1 END) > 0 THEN 'fail'
            WHEN COUNT(CASE WHEN result = 'pass' THEN 1 END) = COUNT(*) THEN 'pass'
            ELSE 'conditional'
        END
    INTO v_overall_result
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Update quality check
    UPDATE purchase_order_quality_checks
    SET 
        status = CASE 
            WHEN v_overall_result = 'pass' THEN 'passed'
            WHEN v_overall_result = 'fail' THEN 'failed'
            ELSE 'partial'
        END,
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = COALESCE(p_notes, notes),
        signature = COALESCE(p_signature, signature),
        updated_at = NOW()
    WHERE id = p_quality_check_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_quality_check_summary(UUID);

-- Function to get quality check summary
CREATE OR REPLACE FUNCTION get_quality_check_summary(p_purchase_order_id UUID)
RETURNS TABLE (
    quality_check_id UUID,
    status TEXT,
    overall_result TEXT,
    checked_by UUID,
    checked_at TIMESTAMPTZ,
    total_items INTEGER,
    passed_items INTEGER,
    failed_items INTEGER,
    pending_items INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qc.id,
        qc.status,
        qc.overall_result,
        qc.checked_by,
        qc.checked_at,
        COUNT(qci.id)::INTEGER as total_items,
        COUNT(CASE WHEN qci.result = 'pass' THEN 1 END)::INTEGER as passed_items,
        COUNT(CASE WHEN qci.result = 'fail' THEN 1 END)::INTEGER as failed_items,
        COUNT(CASE WHEN qci.result = 'na' THEN 1 END)::INTEGER as pending_items
    FROM purchase_order_quality_checks qc
    LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
    WHERE qc.purchase_order_id = p_purchase_order_id
    GROUP BY qc.id, qc.status, qc.overall_result, qc.checked_by, qc.checked_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 12: CREATE SAMPLE QUALITY CHECK
-- =====================================================

-- Create a quality check for the test purchase order
DO $$
DECLARE
    v_quality_check_id UUID;
    v_user_id UUID := 'a7c9adb7-f525-4850-bd42-79a769f12953';
    v_po_id UUID := 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';
BEGIN
    -- Check if purchase order exists
    IF EXISTS (SELECT 1 FROM lats_purchase_orders WHERE id = v_po_id) THEN
        -- Create quality check using electronics template
        v_quality_check_id := create_quality_check_from_template(
            v_po_id,
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            v_user_id
        );
        
        RAISE NOTICE '✅ Created quality check: %', v_quality_check_id;
    ELSE
        RAISE NOTICE 'ℹ️  Purchase order % not found, skipping sample quality check creation', v_po_id;
    END IF;
END $$;

-- =====================================================
-- STEP 13: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on tables
GRANT ALL ON quality_check_templates TO PUBLIC;
GRANT ALL ON quality_check_criteria TO PUBLIC;
GRANT ALL ON purchase_order_quality_checks TO PUBLIC;
GRANT ALL ON purchase_order_quality_check_items TO PUBLIC;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_quality_check_from_template TO PUBLIC;
GRANT EXECUTE ON FUNCTION complete_quality_check TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_quality_check_summary TO PUBLIC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Quality Check System Recreated Successfully!';
    RAISE NOTICE '📋 Created tables:';
    RAISE NOTICE '   ✅ quality_check_templates';
    RAISE NOTICE '   ✅ quality_check_criteria';
    RAISE NOTICE '   ✅ purchase_order_quality_checks';
    RAISE NOTICE '   ✅ purchase_order_quality_check_items';
    RAISE NOTICE '🔧 Created functions:';
    RAISE NOTICE '   ✅ create_quality_check_from_template()';
    RAISE NOTICE '   ✅ complete_quality_check()';
    RAISE NOTICE '   ✅ get_quality_check_summary()';
    RAISE NOTICE '   ✅ Auto-update triggers';
    RAISE NOTICE '📝 Created templates:';
    RAISE NOTICE '   ✅ Electronics Quality Check (7 criteria)';
    RAISE NOTICE '   ✅ General Quality Check (4 criteria)';
    RAISE NOTICE '🚀 Quality check system is ready to use!';
END $$;
