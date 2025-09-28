-- Update iPhone 6 LCD spare part with proper values
UPDATE lats_spare_parts 
SET 
  quantity = 10,
  min_quantity = 2,
  cost_price = 50000,
  selling_price = 75000,
  updated_at = NOW()
WHERE id = '1fcd624d-f85a-465c-8a48-4572c0a78170';

-- Verify the update
SELECT 
  id,
  name,
  part_number,
  quantity,
  min_quantity,
  cost_price,
  selling_price,
  (quantity * cost_price) as total_value,
  (quantity * (selling_price - cost_price)) as total_profit
FROM lats_spare_parts 
WHERE id = '1fcd624d-f85a-465c-8a48-4572c0a78170';
