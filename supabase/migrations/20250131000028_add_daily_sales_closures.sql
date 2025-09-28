-- Create daily_sales_closures table for customer care daily closing functionality
CREATE TABLE IF NOT EXISTS daily_sales_closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_by TEXT NOT NULL DEFAULT 'system',
  sales_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_date ON daily_sales_closures(date);

-- Create index for closed_at lookups
CREATE INDEX IF NOT EXISTS idx_daily_sales_closures_closed_at ON daily_sales_closures(closed_at);

-- Add RLS policies
ALTER TABLE daily_sales_closures ENABLE ROW LEVEL SECURITY;

-- Policy for reading daily closures (all authenticated users)
CREATE POLICY "Allow read daily closures" ON daily_sales_closures
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting daily closures (authenticated users only)
CREATE POLICY "Allow insert daily closures" ON daily_sales_closures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating daily closures (authenticated users only)
CREATE POLICY "Allow update daily closures" ON daily_sales_closures
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE daily_sales_closures IS 'Tracks daily sales closures for customer care operations';
COMMENT ON COLUMN daily_sales_closures.date IS 'The date for which sales are closed';
COMMENT ON COLUMN daily_sales_closures.total_sales IS 'Total sales amount for the day';
COMMENT ON COLUMN daily_sales_closures.total_transactions IS 'Total number of transactions for the day';
COMMENT ON COLUMN daily_sales_closures.closed_at IS 'When the daily sales were closed';
COMMENT ON COLUMN daily_sales_closures.closed_by IS 'Who closed the daily sales';
COMMENT ON COLUMN daily_sales_closures.sales_data IS 'Snapshot of sales data at closing time';
