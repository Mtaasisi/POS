-- Fix device payment schema issues
-- Add missing payment-related columns to devices table

-- Add repair cost and deposit amount columns
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS repair_price DECIMAL(10,2) DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_repair_cost ON devices(repair_cost);
CREATE INDEX IF NOT EXISTS idx_devices_deposit_amount ON devices(deposit_amount);

-- Update existing devices with default values
UPDATE devices 
SET repair_cost = 0, deposit_amount = 0, repair_price = 0 
WHERE repair_cost IS NULL OR deposit_amount IS NULL OR repair_price IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN devices.repair_cost IS 'Total repair cost for the device';
COMMENT ON COLUMN devices.deposit_amount IS 'Deposit amount paid by customer';
COMMENT ON COLUMN devices.repair_price IS 'Final repair price (may differ from cost)';
