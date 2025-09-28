-- Comprehensive fix for device status update issues
-- This addresses constraint conflicts, missing columns, and trigger problems

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

-- Step 5: Create or replace the trigger function
CREATE OR REPLACE FUNCTION create_pending_payments_on_repair_complete()
RETURNS TRIGGER AS $$
DECLARE
  device_record RECORD;
  repair_cost DECIMAL(10,2) := 0;
  deposit_amount DECIMAL(10,2) := 0;
  existing_payment_count INTEGER := 0;
BEGIN
  -- Only trigger when status changes to 'repair-complete'
  IF NEW.status = 'repair-complete' AND (OLD.status IS NULL OR OLD.status != 'repair-complete') THEN
    
    -- Get device information with safe column access
    SELECT 
      COALESCE(repair_cost, 0) as repair_cost,
      COALESCE(deposit_amount, 0) as deposit_amount,
      customer_id
    INTO device_record
    FROM devices
    WHERE id = NEW.id;
    
    -- Calculate costs safely
    repair_cost := COALESCE(device_record.repair_cost, 0);
    deposit_amount := COALESCE(device_record.deposit_amount, 0);
    
    -- Check if pending payments already exist
    SELECT COUNT(*)
    INTO existing_payment_count
    FROM customer_payments
    WHERE device_id = NEW.id
      AND status = 'pending';
    
    -- Create pending payments if they don't exist and costs are set
    IF existing_payment_count = 0 THEN
      
      -- Create repair cost payment if needed
      IF repair_cost > 0 THEN
        INSERT INTO customer_payments (
          customer_id, device_id, amount, method, payment_type, 
          status, payment_date, notes, created_at
        ) VALUES (
          device_record.customer_id, NEW.id, repair_cost, 'cash', 'payment',
          'pending', NOW(), 'Repair cost payment', NOW()
        );
      END IF;
      
      -- Create deposit payment if needed
      IF deposit_amount > 0 THEN
        INSERT INTO customer_payments (
          customer_id, device_id, amount, method, payment_type,
          status, payment_date, notes, created_at
        ) VALUES (
          device_record.customer_id, NEW.id, deposit_amount, 'cash', 'deposit',
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

-- Step 7: Verification (simplified to avoid column reference issues)
DO $$
DECLARE
    repair_cost_exists BOOLEAN;
    deposit_amount_exists BOOLEAN;
    trigger_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if repair_cost column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'repair_cost'
    ) INTO repair_cost_exists;
    
    -- Check if deposit_amount column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'deposit_amount'
    ) INTO deposit_amount_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'trigger_create_pending_payments'
    ) INTO trigger_exists;
    
    -- Check if constraint exists (using check_constraints instead)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'devices_status_check'
    ) INTO constraint_exists;
    
    IF repair_cost_exists AND deposit_amount_exists AND trigger_exists AND constraint_exists THEN
        RAISE NOTICE '✅ All components are in place!';
        RAISE NOTICE '✅ Device status updates to repair-complete should work now!';
        RAISE NOTICE '✅ repair-complete status is now allowed in the constraint!';
    ELSE
        RAISE NOTICE '❌ Some components are missing:';
        RAISE NOTICE '   repair_cost column: %', repair_cost_exists;
        RAISE NOTICE '   deposit_amount column: %', deposit_amount_exists;
        RAISE NOTICE '   trigger: %', trigger_exists;
        RAISE NOTICE '   constraint: %', constraint_exists;
    END IF;
END $$;
