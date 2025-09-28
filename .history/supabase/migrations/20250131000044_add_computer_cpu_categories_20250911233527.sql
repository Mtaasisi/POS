-- Migration: 20250131000044_add_computer_cpu_categories.sql
-- Add Computer parent category and CPU subcategory

-- First, add the Computer parent category
INSERT INTO lats_categories (name, description, color, is_active, sort_order, icon)
VALUES (
    'Computer',
    'Computer systems and components',
    '#3B82F6',
    true,
    1,
    'monitor'
) ON CONFLICT (name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- Get the Computer category ID for the subcategory
DO $$
DECLARE
    computer_category_id UUID;
BEGIN
    -- Get the Computer category ID
    SELECT id INTO computer_category_id 
    FROM lats_categories 
    WHERE name = 'Computer' AND parent_id IS NULL;
    
    -- If Computer category exists, add CPU as subcategory
    IF computer_category_id IS NOT NULL THEN
        INSERT INTO lats_categories (name, description, parent_id, color, is_active, sort_order, icon)
        VALUES (
            'CPU',
            'Central Processing Units and processors',
            computer_category_id,
            '#10B981',
            true,
            1,
            'cpu'
        ) ON CONFLICT (name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
        
        RAISE NOTICE 'Successfully added CPU subcategory under Computer category';
    ELSE
        RAISE NOTICE 'Computer category not found, skipping CPU subcategory creation';
    END IF;
END $$;

-- Verify the categories were created
SELECT 
    c1.name as parent_category,
    c1.id as parent_id,
    c2.name as subcategory,
    c2.id as subcategory_id,
    c2.parent_id
FROM lats_categories c1
LEFT JOIN lats_categories c2 ON c1.id = c2.parent_id
WHERE c1.name = 'Computer'
ORDER BY c2.sort_order;
