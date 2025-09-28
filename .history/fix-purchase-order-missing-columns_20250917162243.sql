-- Fix missing columns in lats_purchase_orders table
-- This addresses the 400 Bad Request error when creating purchase orders

-- Add missing payment-related columns
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30';

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0;

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Add missing shipping columns
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_date DATE;

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS delivered_date DATE;

-- Add constraints
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT IF NOT EXISTS check_payment_status 
CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT IF NOT EXISTS check_shipping_status 
CHECK (shipping_status IN ('pending', 'shipped', 'in_transit', 'delivered', 'cancelled'));

-- Update existing records
UPDATE lats_purchase_orders 
SET payment_status = 'unpaid', shipping_status = 'pending'
WHERE payment_status IS NULL OR shipping_status IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Purchase order table columns added successfully';
    RAISE NOTICE 'Fixed 400 Bad Request error for purchase order creation';
END $$;
