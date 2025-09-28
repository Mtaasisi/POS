-- Test script to create a daily closure record
-- This will activate the daily closure warning system

-- Insert a test daily closure record for today
INSERT INTO daily_sales_closures (
  date,
  total_sales,
  total_transactions,
  closed_at,
  closed_by,
  closed_by_user_id,
  sales_data
) VALUES (
  CURRENT_DATE,
  150000.00,
  25,
  NOW(),
  'test_user',
  '5cdb5078-26e3-4694-8096-1f7437b4dea8',
  '{"test": "data"}'
) ON CONFLICT (date) DO UPDATE SET
  total_sales = EXCLUDED.total_sales,
  total_transactions = EXCLUDED.total_transactions,
  closed_at = EXCLUDED.closed_at,
  closed_by = EXCLUDED.closed_by,
  closed_by_user_id = EXCLUDED.closed_by_user_id,
  sales_data = EXCLUDED.sales_data;

-- Verify the record was created
SELECT * FROM daily_sales_closures WHERE date = CURRENT_DATE;

-- To remove the test record later, run:
-- DELETE FROM daily_sales_closures WHERE date = CURRENT_DATE;
