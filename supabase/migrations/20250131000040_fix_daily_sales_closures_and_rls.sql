-- Fix daily_sales_closures table and RLS policies for online database
-- Migration: 20250131000040_fix_daily_sales_closures_and_rls.sql

-- Create daily_sales_closures table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_sales_closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_by TEXT NOT NULL DEFAULT 'system',
  closed_by_user_id UUID,
  sales_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_date ON daily_sales_closures(date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_closed_at ON daily_sales_closures(closed_at);

-- Enable RLS
ALTER TABLE daily_sales_closures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read daily closures" ON daily_sales_closures;
DROP POLICY IF EXISTS "Allow insert daily closures" ON daily_sales_closures;
DROP POLICY IF EXISTS "Allow update daily closures" ON daily_sales_closures;

-- Create permissive policies for online database
CREATE POLICY "Allow all operations on daily closures" ON daily_sales_closures
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON daily_sales_closures TO authenticated;
GRANT ALL ON daily_sales_closures TO anon;

-- Also fix lats_sales RLS policies to be more permissive
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;

-- Create permissive policies for online database
CREATE POLICY "Allow all operations on lats_sales" ON lats_sales
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sales TO anon;

-- Fix lats_sale_items RLS policies
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;

-- Create permissive policies for online database
CREATE POLICY "Allow all operations on lats_sale_items" ON lats_sale_items
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON lats_sale_items TO authenticated;
GRANT ALL ON lats_sale_items TO anon;

-- Add comments
COMMENT ON TABLE daily_sales_closures IS 'Tracks daily sales closures for customer care operations';
COMMENT ON COLUMN daily_sales_closures.date IS 'The date for which sales are closed';
COMMENT ON COLUMN daily_sales_closures.total_sales IS 'Total sales amount for the day';
COMMENT ON COLUMN daily_sales_closures.total_transactions IS 'Total number of transactions for the day';
COMMENT ON COLUMN daily_sales_closures.closed_at IS 'When the daily sales were closed';
COMMENT ON COLUMN daily_sales_closures.closed_by IS 'Who closed the daily sales';
COMMENT ON COLUMN daily_sales_closures.closed_by_user_id IS 'User ID who closed the daily sales';
COMMENT ON COLUMN daily_sales_closures.sales_data IS 'Snapshot of sales data at closing time';
