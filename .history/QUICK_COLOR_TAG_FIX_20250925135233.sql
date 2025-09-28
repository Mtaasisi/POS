-- =====================================================
-- QUICK FIX FOR COLOR TAG CONSTRAINT ERROR
-- =====================================================

-- Fix any customers with invalid color_tag values
UPDATE customers 
SET 
    color_tag = CASE
        WHEN color_tag = 'regular' THEN 'normal'
        WHEN color_tag = 'basic' THEN 'normal'
        WHEN color_tag = 'standard' THEN 'normal'
        WHEN color_tag = 'default' THEN 'new'
        WHEN color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal') THEN 'normal'
        ELSE color_tag
    END,
    updated_at = NOW()
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal');

-- Verify the fix
SELECT 
    'Color Tag Fix Applied' as status,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN color_tag = 'new' THEN 1 END) as new_customers,
    COUNT(CASE WHEN color_tag = 'vip' THEN 1 END) as vip_customers,
    COUNT(CASE WHEN color_tag = 'complainer' THEN 1 END) as complainer_customers,
    COUNT(CASE WHEN color_tag = 'purchased' THEN 1 END) as purchased_customers,
    COUNT(CASE WHEN color_tag = 'normal' THEN 1 END) as normal_customers
FROM customers;

-- Show any remaining invalid color tags (should be 0)
SELECT 
    'Invalid Color Tags' as status,
    color_tag,
    COUNT(*) as count
FROM customers 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal')
GROUP BY color_tag;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Color tag constraint error fixed!';
    RAISE NOTICE '✅ All customers now have valid color_tag values';
    RAISE NOTICE '🚀 Database is ready for the main fixes!';
END $$;
