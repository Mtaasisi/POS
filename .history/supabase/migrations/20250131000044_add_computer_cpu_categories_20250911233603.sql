-- Migration: 20250131000044_add_computer_cpu_categories.sql
-- Add Computer parent category and CPU subcategory

DO $$
DECLARE
    computer_category_id UUID;
    cpu_exists BOOLEAN;
BEGIN
    -- Check if Computer category already exists
    SELECT id INTO computer_category_id 
    FROM lats_categories 
    WHERE name = 'Computer' AND parent_id IS NULL;
    
    -- If Computer category doesn't exist, create it
    IF computer_category_id IS NULL THEN
        INSERT INTO lats_categories (name, description, color, is_active, sort_order)
        VALUES (
            'Computer',
            'Computer systems and components',
            '#3B82F6',
            true,
            1
        ) RETURNING id INTO computer_category_id;
        
        RAISE NOTICE 'Created Computer parent category with ID: %', computer_category_id;
    ELSE
        RAISE NOTICE 'Computer category already exists with ID: %', computer_category_id;
    END IF;
    
    -- Check if CPU subcategory already exists under Computer
    SELECT EXISTS(
        SELECT 1 FROM lats_categories 
        WHERE name = 'CPU' AND parent_id = computer_category_id
    ) INTO cpu_exists;
    
    -- If CPU subcategory doesn't exist, create it
    IF NOT cpu_exists THEN
        INSERT INTO lats_categories (name, description, parent_id, color, is_active, sort_order, icon)
        VALUES (
            'CPU',
            'Central Processing Units and processors',
            computer_category_id,
            '#10B981',
            true,
            1,
            'cpu'
        );
        
        RAISE NOTICE 'Created CPU subcategory under Computer category';
    ELSE
        RAISE NOTICE 'CPU subcategory already exists under Computer category';
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
