-- Simple fix for device status update issues
-- This addresses the 400 Bad Request error when updating to repair-complete

-- Step 1: Add missing columns if they don't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;

-- Step 2: Drop any conflicting constraints
ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_status_transitions;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Step 3: Add the comprehensive constraint with all required statuses
ALTER TABLE devices ADD CONSTRAINT devices_status_check 
CHECK (status IN (
    'assigned', 
    'diagnosis-started', 
    'awaiting-admin-review',
    'awaiting-parts', 
    'parts-arrived',
    'in-repair', 
    'reassembled-testing', 
    'repair-complete', 
    'process-payments',
    'returned-to-customer-care', 
    'done', 
    'failed'
));

-- Step 4: Update the comment to reflect all statuses
COMMENT ON COLUMN devices.status IS 'Device status: assigned, diagnosis-started, awaiting-admin-review, awaiting-parts, parts-arrived, in-repair, reassembled-testing, repair-complete, process-payments, returned-to-customer-care, done, failed';

-- Step 5: Create or replace the trigger function (simplified)
CREATE OR REPLACE FUNCTION create_pending_payments_on_repair_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'repair-complete'
  IF NEW.status = 'repair-complete' AND (OLD.status IS NULL OR OLD.status != 'repair-complete') THEN
    
    -- Simple check for existing payments
    IF NOT EXISTS (
      SELECT 1 FROM customer_payments 
      WHERE device_id = NEW.id AND status = 'pending'
    ) THEN
      
      -- Create repair cost payment if repair_cost > 0
      IF COALESCE(NEW.repair_cost, 0) > 0 THEN
        INSERT INTO customer_payments (
          customer_id, device_id, amount, method, payment_type, 
          status, payment_date, notes, created_at
        ) VALUES (
          NEW.customer_id, NEW.id, NEW.repair_cost, 'cash', 'payment',
          'pending', NOW(), 'Repair cost payment', NOW()
        );
      END IF;
      
      -- Create deposit payment if deposit_amount > 0
      IF COALESCE(NEW.deposit_amount, 0) > 0 THEN
        INSERT INTO customer_payments (
          customer_id, device_id, amount, method, payment_type,
          status, payment_date, notes, created_at
        ) VALUES (
          NEW.customer_id, NEW.id, NEW.deposit_amount, 'cash', 'deposit',
          'pending', NOW(), 'Deposit payment', NOW()
        );
      END IF;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_pending_payments ON devices;
CREATE TRIGGER trigger_create_pending_payments
  AFTER UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_payments_on_repair_complete();

-- Simple verification
SELECT 'Device status fix applied successfully!' as status;
