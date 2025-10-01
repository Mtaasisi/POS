-- Fix Product Pricing Issues
-- This script fixes the SKU-1759321763804-KXP product and similar issues

-- =====================================================
-- STEP 1: IDENTIFY PROBLEMATIC PRODUCTS
-- =====================================================

-- Find products with zero selling price but non-zero cost price
SELECT 
    p.id,
    p.name,
    p.sku,
    pv.sku as variant_sku,
    pv.cost_price,
    pv.selling_price,
    pv.quantity,
    p.is_active,
    (pv.selling_price - pv.cost_price) as profit_per_unit,
    (pv.quantity * pv.selling_price) as total_value
FROM lats_products p
JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE pv.selling_price = 0 
  AND pv.cost_price > 0
  AND pv.quantity > 0;

-- =====================================================
-- STEP 2: FIX SPECIFIC PRODUCT (SKU-1759321763804-KXP)
-- =====================================================

-- Update the specific product variant with proper pricing
UPDATE lats_product_variants 
SET 
    selling_price = cost_price * 1.5,  -- 50% markup
    updated_at = NOW()
WHERE sku = 'SKU-1759321763804-KXP';

-- Activate the product if it's inactive
UPDATE lats_products 
SET 
    is_active = true,
    updated_at = NOW()
WHERE id = (
    SELECT product_id 
    FROM lats_product_variants 
    WHERE sku = 'SKU-1759321763804-KXP'
);

-- =====================================================
-- STEP 3: FIX ALL SIMILAR PRODUCTS
-- =====================================================

-- Apply 50% markup to all products with zero selling price
UPDATE lats_product_variants 
SET 
    selling_price = cost_price * 1.5,
    updated_at = NOW()
WHERE selling_price = 0 
  AND cost_price > 0;

-- Activate all products that have stock but are inactive
UPDATE lats_products 
SET 
    is_active = true,
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT pv.product_id
    FROM lats_product_variants pv
    WHERE pv.quantity > 0
)
AND is_active = false;

-- =====================================================
-- STEP 4: UPDATE PRODUCT TOTALS
-- =====================================================

-- Update total_value for all products
UPDATE lats_products 
SET 
    total_value = (
        SELECT COALESCE(SUM(pv.quantity * pv.selling_price), 0)
        FROM lats_product_variants pv
        WHERE pv.product_id = lats_products.id
    ),
    total_quantity = (
        SELECT COALESCE(SUM(pv.quantity), 0)
        FROM lats_product_variants pv
        WHERE pv.product_id = lats_products.id
    ),
    updated_at = NOW();

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Verify the fix worked
SELECT 
    p.name,
    p.sku,
    pv.sku as variant_sku,
    pv.cost_price,
    pv.selling_price,
    pv.quantity,
    p.is_active,
    (pv.selling_price - pv.cost_price) as profit_per_unit,
    (pv.quantity * pv.selling_price) as total_value,
    ROUND(((pv.selling_price - pv.cost_price) / pv.cost_price * 100), 2) as markup_percentage
FROM lats_products p
JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE pv.sku = 'SKU-1759321763804-KXP';

-- Check for any remaining problematic products
SELECT 
    COUNT(*) as remaining_zero_price_products
FROM lats_product_variants 
WHERE selling_price = 0 
  AND cost_price > 0 
  AND quantity > 0;
