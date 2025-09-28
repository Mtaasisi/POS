-- Add repair_price field to devices table
-- Migration: 20250131000016_add_repair_price_to_devices.sql

-- Add repair_price column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_price NUMERIC(12,2) DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_devices_repair_price ON devices(repair_price);

-- Add comment for documentation
COMMENT ON COLUMN devices.repair_price IS 'The actual repair cost charged to the customer';
