-- Migration to remove maxStockLevel and isActive fields
-- This migration removes the max_quantity column from lats_product_variants
-- and the is_active column from lats_products

-- Remove max_quantity column from lats_product_variants
ALTER TABLE lats_product_variants DROP COLUMN IF EXISTS max_quantity;

-- Remove is_active column from lats_products
ALTER TABLE lats_products DROP COLUMN IF EXISTS is_active;

-- Remove is_active column from lats_spare_parts
ALTER TABLE lats_spare_parts DROP COLUMN IF EXISTS is_active;

-- Drop indexes that reference is_active
DROP INDEX IF EXISTS idx_lats_products_active;
DROP INDEX IF EXISTS idx_products_category_brand_active;

-- Update the function that calculates total products to not filter by is_active
CREATE OR REPLACE FUNCTION update_business_metrics()
RETURNS void AS $$
BEGIN
    -- Update total products count (removed is_active filter)
    UPDATE lats_business_metrics 
    SET 
        total_products = (SELECT COUNT(*) FROM lats_products),
        total_customers = (SELECT COUNT(*) FROM lats_customers),
        total_sales = (SELECT COALESCE(SUM(total_amount), 0) FROM lats_sales),
        total_revenue = (SELECT COALESCE(SUM(total_amount), 0) FROM lats_sales WHERE status = 'completed'),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
