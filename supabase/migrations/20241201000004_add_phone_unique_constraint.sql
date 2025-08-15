-- Add unique constraint on phone field in customers table
-- This prevents storing customers with the same phone number

-- First, handle existing duplicate phone numbers by appending suffixes
-- This uses a window function to identify and update duplicates

-- Create a temporary table to store the updates
CREATE TEMP TABLE phone_updates AS
WITH ranked_customers AS (
  SELECT 
    id,
    name,
    phone,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at) as rn
  FROM customers
  WHERE phone IS NOT NULL AND phone != ''
)
SELECT 
  id,
  phone,
  CASE 
    WHEN rn > 1 THEN phone || '_dup' || (rn - 1)
    ELSE phone
  END as new_phone
FROM ranked_customers
WHERE rn > 1;

-- Apply the updates to fix duplicates
UPDATE customers 
SET phone = pu.new_phone
FROM phone_updates pu
WHERE customers.id = pu.id;

-- Clean up temporary table
DROP TABLE phone_updates;

-- Now add unique constraint on phone field
ALTER TABLE customers 
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- Add an index to improve query performance for phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT customers_phone_unique ON customers IS 'Ensures phone numbers are unique across all customers';
