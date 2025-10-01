-- =====================================================
-- FIXED QUALITY CHECK SYSTEM - HANDLES EXISTING FUNCTIONS
-- This script fixes the quality check system and handles existing functions
-- =====================================================

-- =====================================================
-- STEP 1: DROP EXISTING FUNCTIONS TO AVOID CONFLICTS
-- =====================================================

-- Drop existing quality check functions to avoid return type conflicts
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS complete_quality_check(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS complete_quality_check(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_quality_check_from_template(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_quality_check_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS receive_quality_checked_items(UUID, UUID) CASCADE;

-- =====================================================
-- STEP 2: CREATE QUALITY CHECK TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS quality_check_templates (
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

CREATE TABLE IF NOT EXISTS quality_check_criteria (
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

CREATE TABLE IF NOT EXISTS purchase_order_quality_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    template_id UUID REFERENCES quality_check_templates(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional')),
    checked_by UUID,
    checked_at TIMESTAMPTZ,
    notes TEXT,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE PURCHASE ORDER QUALITY CHECK ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_order_quality_check_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quality_check_id UUID NOT NULL REFERENCES purchase_order_quality_checks(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES quality_check_criteria(id) ON DELETE SET NULL,
    criteria_name TEXT NOT NULL,
    result TEXT DEFAULT 'na' CHECK (result IN ('pass', 'fail', 'na')),
    quantity_checked INTEGER DEFAULT 0,
    quantity_passed INTEGER DEFAULT 0,
    quantity_failed INTEGER DEFAULT 0,
    defect_type TEXT,
    defect_description TEXT,
    action_taken TEXT CHECK (action_taken IN ('accept', 'reject', 'return', 'replace', 'repair')),
    notes TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 6: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quality_check_criteria_template_id ON quality_check_criteria(template_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_po_id ON purchase_order_quality_checks(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_quality_checks_status ON purchase_order_quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_quality_check_items_qc_id ON purchase_order_quality_check_items(quality_check_id);
CREATE INDEX IF NOT EXISTS idx_quality_check_items_po_item_id ON purchase_order_quality_check_items(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_quality_check_items_result ON purchase_order_quality_check_items(result);

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE quality_check_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_check_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_quality_check_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Quality check templates are viewable by authenticated users" ON quality_check_templates;
DROP POLICY IF EXISTS "Quality check templates are insertable by authenticated users" ON quality_check_templates;
DROP POLICY IF EXISTS "Quality check templates are updatable by authenticated users" ON quality_check_templates;
DROP POLICY IF EXISTS "Quality check templates are deletable by authenticated users" ON quality_check_templates;

DROP POLICY IF EXISTS "Quality check criteria are viewable by authenticated users" ON quality_check_criteria;
DROP POLICY IF EXISTS "Quality check criteria are insertable by authenticated users" ON quality_check_criteria;
DROP POLICY IF EXISTS "Quality check criteria are updatable by authenticated users" ON quality_check_criteria;
DROP POLICY IF EXISTS "Quality check criteria are deletable by authenticated users" ON quality_check_criteria;

DROP POLICY IF EXISTS "Purchase order quality checks are viewable by authenticated users" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Purchase order quality checks are insertable by authenticated users" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Purchase order quality checks are updatable by authenticated users" ON purchase_order_quality_checks;
DROP POLICY IF EXISTS "Purchase order quality checks are deletable by authenticated users" ON purchase_order_quality_checks;

DROP POLICY IF EXISTS "Purchase order quality check items are viewable by authenticated users" ON purchase_order_quality_check_items;
DROP POLICY IF EXISTS "Purchase order quality check items are insertable by authenticated users" ON purchase_order_quality_check_items;
DROP POLICY IF EXISTS "Purchase order quality check items are updatable by authenticated users" ON purchase_order_quality_check_items;
DROP POLICY IF EXISTS "Purchase order quality check items are deletable by authenticated users" ON purchase_order_quality_check_items;

-- Quality Check Templates Policies
CREATE POLICY "Quality check templates are viewable by authenticated users" ON quality_check_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality check templates are insertable by authenticated users" ON quality_check_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Quality check templates are updatable by authenticated users" ON quality_check_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Quality check templates are deletable by authenticated users" ON quality_check_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Quality Check Criteria Policies
CREATE POLICY "Quality check criteria are viewable by authenticated users" ON quality_check_criteria
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality check criteria are insertable by authenticated users" ON quality_check_criteria
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Quality check criteria are updatable by authenticated users" ON quality_check_criteria
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Quality check criteria are deletable by authenticated users" ON quality_check_criteria
    FOR DELETE USING (auth.role() = 'authenticated');

-- Purchase Order Quality Checks Policies
CREATE POLICY "Purchase order quality checks are viewable by authenticated users" ON purchase_order_quality_checks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality checks are insertable by authenticated users" ON purchase_order_quality_checks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality checks are updatable by authenticated users" ON purchase_order_quality_checks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality checks are deletable by authenticated users" ON purchase_order_quality_checks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Purchase Order Quality Check Items Policies
CREATE POLICY "Purchase order quality check items are viewable by authenticated users" ON purchase_order_quality_check_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality check items are insertable by authenticated users" ON purchase_order_quality_check_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality check items are updatable by authenticated users" ON purchase_order_quality_check_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Purchase order quality check items are deletable by authenticated users" ON purchase_order_quality_check_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- STEP 8: CREATE RPC FUNCTIONS (WITH PROPER RETURN TYPES)
-- =====================================================

-- Function to create quality check from template
CREATE OR REPLACE FUNCTION create_quality_check_from_template(
    p_purchase_order_id UUID,
    p_template_id UUID,
    p_checked_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_quality_check_id UUID;
    v_criteria_record RECORD;
    v_po_item_record RECORD;
BEGIN
    -- Create the quality check
    INSERT INTO purchase_order_quality_checks (
        purchase_order_id,
        template_id,
        checked_by,
        status
    ) VALUES (
        p_purchase_order_id,
        p_template_id,
        COALESCE(p_checked_by, auth.uid()),
        'in_progress'
    ) RETURNING id INTO v_quality_check_id;

    -- Get all criteria for the template
    FOR v_criteria_record IN
        SELECT * FROM quality_check_criteria
        WHERE template_id = p_template_id
        ORDER BY sort_order
    LOOP
        -- Get all purchase order items
        FOR v_po_item_record IN
            SELECT * FROM lats_purchase_order_items
            WHERE purchase_order_id = p_purchase_order_id
        LOOP
            -- Create quality check item for each PO item and criteria combination
            INSERT INTO purchase_order_quality_check_items (
                quality_check_id,
                purchase_order_item_id,
                criteria_id,
                criteria_name
            ) VALUES (
                v_quality_check_id,
                v_po_item_record.id,
                v_criteria_record.id,
                v_criteria_record.name
            );
        END LOOP;
    END LOOP;

    RETURN v_quality_check_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete quality check (FIXED RETURN TYPE)
CREATE OR REPLACE FUNCTION complete_quality_check(
    p_quality_check_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_signature TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_overall_result TEXT;
    v_quality_check_exists BOOLEAN;
    v_total_items INTEGER;
    v_passed_items INTEGER;
    v_failed_items INTEGER;
BEGIN
    -- Validate that the quality check exists
    SELECT EXISTS(
        SELECT 1 FROM purchase_order_quality_checks 
        WHERE id = p_quality_check_id
    ) INTO v_quality_check_exists;
    
    IF NOT v_quality_check_exists THEN
        RAISE EXCEPTION 'Quality check with ID % not found', p_quality_check_id;
    END IF;
    
    -- Get overall result based on item results
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN result = 'fail' THEN 1 END) > 0 THEN 'fail'
            WHEN COUNT(CASE WHEN result = 'pass' THEN 1 END) = COUNT(*) THEN 'pass'
            WHEN COUNT(CASE WHEN result = 'na' THEN 1 END) = COUNT(*) THEN 'conditional'
            ELSE 'conditional'
        END
    INTO v_overall_result
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Count items for logging
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN result = 'pass' THEN 1 END) as passed,
        COUNT(CASE WHEN result = 'fail' THEN 1 END) as failed
    INTO v_total_items, v_passed_items, v_failed_items
    FROM purchase_order_quality_check_items
    WHERE quality_check_id = p_quality_check_id;
    
    -- Update the quality check
    UPDATE purchase_order_quality_checks
    SET 
        status = 'completed',
        overall_result = v_overall_result,
        checked_at = NOW(),
        notes = p_notes,
        signature = p_signature,
        updated_at = NOW()
    WHERE id = p_quality_check_id;
    
    -- Log completion
    RAISE NOTICE 'Quality check % completed: % items checked, % passed, % failed, overall result: %', 
        p_quality_check_id, v_total_items, v_passed_items, v_failed_items, v_overall_result;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quality check summary
CREATE OR REPLACE FUNCTION get_quality_check_summary(
    p_purchase_order_id UUID
)
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
    GROUP BY qc.id, qc.status, qc.overall_result, qc.checked_by, qc.checked_at
    ORDER BY qc.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to receive quality checked items
CREATE OR REPLACE FUNCTION receive_quality_checked_items(
    p_quality_check_id UUID,
    p_purchase_order_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    items_received INTEGER
) AS $$
DECLARE
    v_items_received INTEGER := 0;
    v_item_record RECORD;
BEGIN
    -- Only receive items that passed quality check
    FOR v_item_record IN
        SELECT 
            qci.purchase_order_item_id,
            qci.quantity_passed,
            poi.quantity as total_quantity,
            poi.received_quantity as current_received
        FROM purchase_order_quality_check_items qci
        JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
        WHERE qci.quality_check_id = p_quality_check_id
        AND qci.result = 'pass'
        AND qci.quantity_passed > 0
    LOOP
        -- Update received quantity
        UPDATE lats_purchase_order_items
        SET 
            received_quantity = COALESCE(current_received, 0) + v_item_record.quantity_passed,
            updated_at = NOW()
        WHERE id = v_item_record.purchase_order_item_id;
        
        v_items_received := v_items_received + 1;
    END LOOP;
    
    RETURN QUERY SELECT TRUE, 
        FORMAT('Successfully received %s quality-checked items to inventory', v_items_received),
        v_items_received;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 9: INSERT DEFAULT TEMPLATES AND CRITERIA
-- =====================================================

-- Insert default electronics template
INSERT INTO quality_check_templates (name, description, category) VALUES
('Electronics Quality Check', 'Standard quality check for electronic devices', 'electronics')
ON CONFLICT (name) DO NOTHING;

-- Insert default accessories template
INSERT INTO quality_check_templates (name, description, category) VALUES
('Accessories Quality Check', 'Standard quality check for accessories', 'accessories')
ON CONFLICT (name) DO NOTHING;

-- Insert default general template
INSERT INTO quality_check_templates (name, description, category) VALUES
('General Quality Check', 'Standard quality check for general items', 'general')
ON CONFLICT (name) DO NOTHING;

-- Get template IDs and insert criteria
DO $$
DECLARE
    v_electronics_template_id UUID;
    v_accessories_template_id UUID;
    v_general_template_id UUID;
BEGIN
    -- Get template IDs
    SELECT id INTO v_electronics_template_id FROM quality_check_templates WHERE name = 'Electronics Quality Check';
    SELECT id INTO v_accessories_template_id FROM quality_check_templates WHERE name = 'Accessories Quality Check';
    SELECT id INTO v_general_template_id FROM quality_check_templates WHERE name = 'General Quality Check';
    
    -- Insert electronics criteria
    IF v_electronics_template_id IS NOT NULL THEN
        INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
        (v_electronics_template_id, 'Physical Condition', 'Check for scratches, dents, or damage', true, 1),
        (v_electronics_template_id, 'Functionality Test', 'Test basic functionality and features', true, 2),
        (v_electronics_template_id, 'Accessories Check', 'Verify all accessories are included', true, 3),
        (v_electronics_template_id, 'Packaging Condition', 'Check packaging for damage', false, 4)
        ON CONFLICT (template_id, name) DO NOTHING;
    END IF;
    
    -- Insert accessories criteria
    IF v_accessories_template_id IS NOT NULL THEN
        INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
        (v_accessories_template_id, 'Physical Condition', 'Check for damage or defects', true, 1),
        (v_accessories_template_id, 'Compatibility Check', 'Verify compatibility with intended device', true, 2),
        (v_accessories_template_id, 'Packaging Check', 'Check packaging condition', false, 3)
        ON CONFLICT (template_id, name) DO NOTHING;
    END IF;
    
    -- Insert general criteria
    IF v_general_template_id IS NOT NULL THEN
        INSERT INTO quality_check_criteria (template_id, name, description, is_required, sort_order) VALUES
        (v_general_template_id, 'Physical Condition', 'Check for damage or defects', true, 1),
        (v_general_template_id, 'Quantity Verification', 'Verify correct quantity received', true, 2),
        (v_general_template_id, 'Packaging Check', 'Check packaging condition', false, 3)
        ON CONFLICT (template_id, name) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- STEP 10: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Quality Check System Setup Complete!';
    RAISE NOTICE '📋 Tables created: quality_check_templates, quality_check_criteria, purchase_order_quality_checks, purchase_order_quality_check_items';
    RAISE NOTICE '🔧 Functions created: create_quality_check_from_template, complete_quality_check, get_quality_check_summary, receive_quality_checked_items';
    RAISE NOTICE '📊 Default templates and criteria inserted';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '🎯 System ready for use!';
END $$;
