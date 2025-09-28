-- =====================================================
-- COMPREHENSIVE CONSTRAINT FIX
-- =====================================================

-- First, let's see what constraints exist
SELECT 
    'Current Constraints' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass;

-- Fix any invalid gender values
UPDATE customers 
SET 
    gender = CASE
        WHEN gender = 'Basic' THEN 'other'
        WHEN gender = 'Unknown' THEN 'other'
        WHEN gender = 'N/A' THEN 'other'
        WHEN gender NOT IN ('male', 'female', 'other') THEN 'other'
        ELSE gender
    END,
    updated_at = NOW()
WHERE gender NOT IN ('male', 'female', 'other') OR gender IS NULL;

-- Fix any invalid loyalty_level values
UPDATE customers 
SET 
    loyalty_level = CASE
        WHEN loyalty_level = 'Basic' THEN 'bronze'
        WHEN loyalty_level = 'Standard' THEN 'bronze'
        WHEN loyalty_level = 'Regular' THEN 'bronze'
        WHEN loyalty_level NOT IN ('bronze', 'silver', 'gold', 'platinum') THEN 'bronze'
        ELSE loyalty_level
    END,
    updated_at = NOW()
WHERE loyalty_level NOT IN ('bronze', 'silver', 'gold', 'platinum') OR loyalty_level IS NULL;

-- Fix any invalid color_tag values
UPDATE customers 
SET 
    color_tag = CASE
        WHEN color_tag = 'Basic' THEN 'normal'
        WHEN color_tag = 'Standard' THEN 'normal'
        WHEN color_tag = 'Regular' THEN 'normal'
        WHEN color_tag = 'Default' THEN 'new'
        WHEN color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal') THEN 'normal'
        ELSE color_tag
    END,
    updated_at = NOW()
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal') OR color_tag IS NULL;

-- Fix birth_month values (should be 1-12)
UPDATE customers 
SET 
    birth_month = CASE
        WHEN birth_month < 1 OR birth_month > 12 THEN NULL
        ELSE birth_month
    END,
    updated_at = NOW()
WHERE birth_month IS NOT NULL AND (birth_month < 1 OR birth_month > 12);

-- Fix birth_day values (should be 1-31)
UPDATE customers 
SET 
    birth_day = CASE
        WHEN birth_day < 1 OR birth_day > 31 THEN NULL
        ELSE birth_day
    END,
    updated_at = NOW()
WHERE birth_day IS NOT NULL AND (birth_day < 1 OR birth_day > 31);

-- Verify all constraints are now satisfied
SELECT 
    'Verification - Invalid Values' as check_type,
    COUNT(CASE WHEN gender NOT IN ('male', 'female', 'other') THEN 1 END) as invalid_gender,
    COUNT(CASE WHEN loyalty_level NOT IN ('bronze', 'silver', 'gold', 'platinum') THEN 1 END) as invalid_loyalty,
    COUNT(CASE WHEN color_tag NOT IN ('new', 'vip', 'complainer', 'purchased', 'normal') THEN 1 END) as invalid_color_tag,
    COUNT(CASE WHEN birth_month IS NOT NULL AND (birth_month < 1 OR birth_month > 12) THEN 1 END) as invalid_birth_month,
    COUNT(CASE WHEN birth_day IS NOT NULL AND (birth_day < 1 OR birth_day > 31) THEN 1 END) as invalid_birth_day
FROM customers;

-- Show the specific customer that was failing
SELECT 
    'Customer 255656007681 Status' as info,
    id,
    name,
    phone,
    gender,
    loyalty_level,
    color_tag,
    birth_month,
    birth_day,
    total_spent,
    points,
    updated_at
FROM customers 
WHERE phone = '255656007681';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All constraint violations should now be fixed!';
    RAISE NOTICE '✅ Gender values: male, female, other only';
    RAISE NOTICE '✅ Loyalty levels: bronze, silver, gold, platinum only';
    RAISE NOTICE '✅ Color tags: new, vip, complainer, purchased, normal only';
    RAISE NOTICE '✅ Birth months: 1-12 or NULL only';
    RAISE NOTICE '✅ Birth days: 1-31 or NULL only';
    RAISE NOTICE '🚀 Database is now ready for updates!';
END $$;
