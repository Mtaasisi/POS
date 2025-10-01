-- =====================================================
-- FIX DUPLICATE QUALITY CHECK CRITERIA
-- =====================================================
-- This migration removes duplicate criteria and adds a unique constraint

-- Step 1: First, update any quality check items that reference duplicate criteria
-- to point to the first (original) criteria
UPDATE purchase_order_quality_check_items
SET criteria_id = subq.first_id
FROM (
    SELECT 
        id,
        FIRST_VALUE(id) OVER (PARTITION BY template_id, name ORDER BY created_at) as first_id
    FROM quality_check_criteria
) subq
WHERE purchase_order_quality_check_items.criteria_id = subq.id
AND subq.id != subq.first_id;

-- Also update the old table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_check_items') THEN
        UPDATE quality_check_items
        SET criteria_id = subq.first_id
        FROM (
            SELECT 
                id,
                FIRST_VALUE(id) OVER (PARTITION BY template_id, name ORDER BY created_at) as first_id
            FROM quality_check_criteria
        ) subq
        WHERE quality_check_items.criteria_id = subq.id
        AND subq.id != subq.first_id;
    END IF;
END $$;

-- Step 2: Now remove duplicate criteria (keep only the first one)
DELETE FROM quality_check_criteria
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY template_id, name 
                   ORDER BY created_at
               ) AS rnum
        FROM quality_check_criteria
    ) t
    WHERE t.rnum > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE quality_check_criteria
DROP CONSTRAINT IF EXISTS quality_check_criteria_template_name_unique;

ALTER TABLE quality_check_criteria
ADD CONSTRAINT quality_check_criteria_template_name_unique 
UNIQUE (template_id, name);

-- Step 4: Verify and log results
DO $$
DECLARE
    v_total_criteria INTEGER;
    v_total_templates INTEGER;
    v_standard_count INTEGER;
    v_electronics_count INTEGER;
    v_phone_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_criteria FROM quality_check_criteria;
    SELECT COUNT(DISTINCT template_id) INTO v_total_templates FROM quality_check_criteria;
    
    SELECT COUNT(*) INTO v_standard_count 
    FROM quality_check_criteria 
    WHERE template_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    
    SELECT COUNT(*) INTO v_electronics_count 
    FROM quality_check_criteria 
    WHERE template_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    
    SELECT COUNT(*) INTO v_phone_count 
    FROM quality_check_criteria 
    WHERE template_id = 'd4e5f6a7-b8c9-0123-def1-234567890123';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Quality Check Criteria Cleanup Complete';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total criteria: %', v_total_criteria;
    RAISE NOTICE 'Total templates: %', v_total_templates;
    RAISE NOTICE 'Standard template: % criteria', v_standard_count;
    RAISE NOTICE 'Electronics template: % criteria', v_electronics_count;
    RAISE NOTICE 'Phone template: % criteria', v_phone_count;
    RAISE NOTICE '==========================================';
END $$;

