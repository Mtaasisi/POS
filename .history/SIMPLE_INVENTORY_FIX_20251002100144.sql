-- =====================================================
-- SIMPLE INVENTORY VALUE FIX
-- =====================================================
-- This script provides a simpler approach to fix inventory values

-- 1. Create function to update product total_value (simplified)
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_product_value_on_insert ON lats_product_variants;
DROP TRIGGER IF EXISTS trigger_update_product_value_on_update ON lats_product_variants;
DROP TRIGGER IF EXISTS trigger_update_product_value_on_delete ON lats_product_variants;

-- Create new triggers
CREATE TRIGGER trigger_update_product_value_on_insert
  AFTER INSERT ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_total_value();

CREATE TRIGGER trigger_update_product_value_on_update
  AFTER UPDATE ON lats_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_total_value();

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

-- 5. Simple sync function (no complex CTEs)
-- =====================================================
CREATE OR REPLACE FUNCTION simple_sync_product_values()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
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
  WHERE is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Create simple monitoring view
-- =====================================================
CREATE OR REPLACE VIEW simple_inventory_monitoring AS
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
GROUP BY p.id, p.name, p.sku, p.total_value, p.updated_at;

-- 7. Run initial sync
-- =====================================================
SELECT 'Starting simple sync of all product values...' as status;

-- Show current discrepancies
WITH product_discrepancies AS (
  SELECT 
    p.id,
    p.name,
    p.total_value,
    COALESCE(SUM(pv.cost_price * pv.quantity), 0) as calculated_value,
    ABS(p.total_value - COALESCE(SUM(pv.cost_price * pv.quantity), 0)) as discrepancy
  FROM lats_products p
  LEFT JOIN lats_product_variants pv ON p.id = pv.product_id
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.total_value
)
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN discrepancy > 1 THEN 1 END) as products_with_discrepancies,
  SUM(discrepancy) as total_discrepancy_value
FROM product_discrepancies;

-- Perform the sync
SELECT simple_sync_product_values() as products_updated;

-- 8. Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id_cost_quantity 
ON lats_product_variants(product_id, cost_price, quantity);

CREATE INDEX IF NOT EXISTS idx_lats_products_total_value 
ON lats_products(total_value) WHERE is_active = true;

-- 9. Final verification
-- =====================================================
SELECT 'Simple inventory value fix completed successfully!' as status;

-- Show final summary
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN sync_status = 'SYNCED' THEN 1 END) as synced_products,
  COUNT(CASE WHEN sync_status = 'NEEDS_SYNC' THEN 1 END) as products_needing_sync,
  COALESCE(SUM(discrepancy), 0) as total_discrepancy_value
FROM simple_inventory_monitoring;
