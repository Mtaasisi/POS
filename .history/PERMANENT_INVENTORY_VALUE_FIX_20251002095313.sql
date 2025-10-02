-- =====================================================
-- PERMANENT INVENTORY VALUE FIX
-- =====================================================
-- This script creates permanent solutions to keep inventory values accurate

-- 1. Create function to update product total_value
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_total_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's total_value and total_quantity
  UPDATE lats_products 
  SET 
    total_value = (
      SELECT COALESCE(SUM(cost_price * quantity), 0)
      FROM lats_product_variants 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    total_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM lats_product_variants 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Create triggers to auto-update product values
-- =====================================================

-- Trigger for INSERT on variants
DROP TRIGGER IF EXISTS trigger_update_product_value_on_insert ON lats_product_variants;
CREATE TRIGGER trigger_update_product_value_on_insert
  AFTER INSERT ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_total_value();

-- Trigger for UPDATE on variants
DROP TRIGGER IF EXISTS trigger_update_product_value_on_update ON lats_product_variants;
CREATE TRIGGER trigger_update_product_value_on_update
  AFTER UPDATE ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_total_value();

-- Trigger for DELETE on variants
DROP TRIGGER IF EXISTS trigger_update_product_value_on_delete ON lats_product_variants;
CREATE TRIGGER trigger_update_product_value_on_delete
  AFTER DELETE ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_total_value();

-- 3. Create validation function for realistic values
-- =====================================================
CREATE OR REPLACE FUNCTION validate_inventory_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for unrealistic cost prices (over 10M TZS)
  IF NEW.cost_price > 10000000 THEN
    RAISE EXCEPTION 'Cost price too high: % TZS. Maximum allowed: 10,000,000 TZS', NEW.cost_price;
  END IF;
  
  -- Check for unrealistic quantities (over 1000)
  IF NEW.quantity > 1000 THEN
    RAISE EXCEPTION 'Quantity too high: %. Maximum allowed: 1000 units', NEW.quantity;
  END IF;
  
  -- Check for negative values
  IF NEW.cost_price < 0 OR NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Negative values not allowed. Cost price: %, Quantity: %', NEW.cost_price, NEW.quantity;
  END IF;
  
  -- Check for zero cost price (might be data entry error)
  IF NEW.cost_price = 0 THEN
    RAISE WARNING 'Cost price is zero for variant % - please verify this is correct', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create validation trigger
-- =====================================================
DROP TRIGGER IF EXISTS trigger_validate_inventory_values ON lats_product_variants;
CREATE TRIGGER trigger_validate_inventory_values
  BEFORE INSERT OR UPDATE ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory_values();

-- 5. Create function to sync all existing product values
-- =====================================================
CREATE OR REPLACE FUNCTION sync_all_product_values()
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  old_total_value DECIMAL,
  new_total_value DECIMAL,
  old_total_quantity INTEGER,
  new_total_quantity INTEGER,
  difference DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH product_backup AS (
    SELECT id, name, total_value, total_quantity
    FROM lats_products
    WHERE is_active = true
  ),
  updated_products AS (
    UPDATE lats_products 
    SET 
      total_value = (
        SELECT COALESCE(SUM(cost_price * quantity), 0)
        FROM lats_product_variants 
        WHERE lats_product_variants.product_id = lats_products.id
      ),
      total_quantity = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM lats_product_variants 
        WHERE lats_product_variants.product_id = lats_products.id
      ),
      updated_at = NOW()
    WHERE is_active = true
    RETURNING 
      id,
      name,
      total_value,
      total_quantity
  )
  SELECT 
    up.id,
    up.name,
    pb.total_value as old_total_value,
    up.total_value as new_total_value,
    pb.total_quantity as old_total_quantity,
    up.total_quantity as new_total_quantity,
    (up.total_value - pb.total_value) as difference
  FROM updated_products up
  JOIN product_backup pb ON up.id = pb.id
  WHERE ABS(up.total_value - pb.total_value) > 1; -- Only show significant differences
END;
$$ LANGUAGE plpgsql;

-- 6. Create maintenance function for periodic corrections
-- =====================================================
CREATE OR REPLACE FUNCTION maintenance_inventory_audit()
RETURNS TABLE(
  audit_date TIMESTAMP,
  total_products INTEGER,
  products_with_discrepancies INTEGER,
  total_discrepancy_value DECIMAL,
  corrected_products INTEGER
) AS $$
DECLARE
  audit_timestamp TIMESTAMP := NOW();
  product_count INTEGER;
  discrepancy_count INTEGER;
  total_discrepancy DECIMAL;
  corrected_count INTEGER;
BEGIN
  -- Count total products
  SELECT COUNT(*) INTO product_count FROM lats_products WHERE is_active = true;
  
  -- Find products with discrepancies
  SELECT COUNT(*) INTO discrepancy_count
  FROM lats_products p
  WHERE p.is_active = true
    AND ABS(p.total_value - (
      SELECT COALESCE(SUM(cost_price * quantity), 0)
      FROM lats_product_variants 
      WHERE lats_product_variants.product_id = p.id
    )) > 1;
  
  -- Calculate total discrepancy value
  SELECT COALESCE(SUM(ABS(p.total_value - (
    SELECT COALESCE(SUM(cost_price * quantity), 0)
    FROM lats_product_variants 
    WHERE lats_product_variants.product_id = p.id
  ))), 0) INTO total_discrepancy
  FROM lats_products p
  WHERE p.is_active = true;
  
  -- Auto-correct discrepancies
  UPDATE lats_products 
  SET 
    total_value = (
      SELECT COALESCE(SUM(cost_price * quantity), 0)
      FROM lats_product_variants 
      WHERE lats_product_variants.product_id = lats_products.id
    ),
    total_quantity = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM lats_product_variants 
      WHERE lats_product_variants.product_id = lats_products.id
    ),
    updated_at = NOW()
  WHERE is_active = true
    AND ABS(total_value - (
      SELECT COALESCE(SUM(cost_price * quantity), 0)
      FROM lats_product_variants 
      WHERE lats_product_variants.product_id = lats_products.id
    )) > 1;
  
  GET DIAGNOSTICS corrected_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    audit_timestamp,
    product_count,
    discrepancy_count,
    total_discrepancy,
    corrected_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for inventory value monitoring
-- =====================================================
CREATE OR REPLACE VIEW inventory_value_monitoring AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.total_value as stored_value,
  COALESCE(SUM(pv.cost_price * pv.quantity), 0) as calculated_value,
  ABS(p.total_value - COALESCE(SUM(pv.cost_price * pv.quantity), 0)) as discrepancy,
  CASE 
    WHEN ABS(p.total_value - COALESCE(SUM(pv.cost_price * pv.quantity), 0)) > 1 
    THEN 'NEEDS_SYNC'
    ELSE 'SYNCED'
  END as sync_status,
  COUNT(pv.id) as variant_count,
  COALESCE(SUM(pv.quantity), 0) as total_quantity,
  p.updated_at
FROM lats_products p
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.sku, p.total_value, p.updated_at
ORDER BY discrepancy DESC;

-- 8. Run initial sync of all product values
-- =====================================================
SELECT 'Starting initial sync of all product values...' as status;

-- Show products that will be updated
SELECT 
  p.name,
  p.total_value as current_value,
  COALESCE(SUM(pv.cost_price * pv.quantity), 0) as calculated_value,
  (COALESCE(SUM(pv.cost_price * pv.quantity), 0) - p.total_value) as difference
FROM lats_products p
LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.total_value
HAVING ABS(p.total_value - COALESCE(SUM(pv.cost_price * pv.quantity), 0)) > 1
ORDER BY ABS(p.total_value - COALESCE(SUM(pv.cost_price * pv.quantity), 0)) DESC;

-- Perform the sync
SELECT * FROM sync_all_product_values();

-- 9. Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id_cost_quantity 
ON lats_product_variants(product_id, cost_price, quantity);

CREATE INDEX IF NOT EXISTS idx_lats_products_total_value 
ON lats_products(total_value) WHERE is_active = true;

-- 10. Final verification
-- =====================================================
SELECT 'Permanent inventory value fix completed successfully!' as status;

-- Show summary
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN sync_status = 'SYNCED' THEN 1 END) as synced_products,
  COUNT(CASE WHEN sync_status = 'NEEDS_SYNC' THEN 1 END) as products_needing_sync,
  SUM(discrepancy) as total_discrepancy_value
FROM inventory_value_monitoring;
