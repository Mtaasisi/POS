-- =====================================================
-- FIX DUPLICATE QUALITY CHECK CRITERIA
-- =====================================================
-- This migration removes duplicate criteria and adds a unique constraint

-- Step 1: Remove duplicate criteria (keep only the first one)
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

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE quality_check_criteria
DROP CONSTRAINT IF EXISTS quality_check_criteria_template_name_unique;

ALTER TABLE quality_check_criteria
ADD CONSTRAINT quality_check_criteria_template_name_unique 
UNIQUE (template_id, name);

-- Step 3: Verify and log results
DO $$
DECLARE
    v_total_criteria INTEGER;
    v_total_templates INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_criteria FROM quality_check_criteria;
    SELECT COUNT(DISTINCT template_id) INTO v_total_templates FROM quality_check_criteria;
    
    RAISE NOTICE 'Total criteria after cleanup: %', v_total_criteria;
    RAISE NOTICE 'Total templates with criteria: %', v_total_templates;
END $$;

