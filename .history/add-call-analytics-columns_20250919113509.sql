-- Add Call Analytics Columns to Customers Table
-- This script adds columns to store call log analytics and loyalty information

-- Step 1: Add new columns for call analytics
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_call_duration_minutes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS incoming_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS outgoing_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missed_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_call_duration_minutes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_call_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_call_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_loyalty_level VARCHAR(20) DEFAULT 'Basic';

-- Step 2: Create index on new columns for better performance
CREATE INDEX IF NOT EXISTS idx_customers_call_loyalty_level ON customers(call_loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_total_calls ON customers(total_calls);
CREATE INDEX IF NOT EXISTS idx_customers_last_call_date ON customers(last_call_date);

-- Step 3: Show the updated table structure
SELECT 
    'Updated customers table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
    AND column_name IN (
        'total_calls', 'total_call_duration_minutes', 'incoming_calls', 
        'outgoing_calls', 'missed_calls', 'avg_call_duration_minutes',
        'first_call_date', 'last_call_date', 'call_loyalty_level'
    )
ORDER BY ordinal_position;
