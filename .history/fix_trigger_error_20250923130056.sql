-- Fix trigger error when updating device status to repair-complete
-- The trigger create_pending_payments_on_repair_complete is failing because
-- it's trying to access repair_cost and deposit_amount columns that don't exist

-- First, add the missing columns if they don't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;

-- Update the trigger function to handle missing columns gracefully
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_pending_payments ON devices;
CREATE TRIGGER trigger_create_pending_payments
  AFTER UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_payments_on_repair_complete();

-- Verification
DO $$
DECLARE
    repair_cost_exists BOOLEAN;
    deposit_amount_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if repair_cost column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'repair_cost'
    ) INTO repair_cost_exists;
    
    -- Check if deposit_amount column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
        AND column_name = 'deposit_amount'
    ) INTO deposit_amount_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'trigger_create_pending_payments'
    ) INTO trigger_exists;
    
    IF repair_cost_exists AND deposit_amount_exists AND trigger_exists THEN
        RAISE NOTICE '✅ All required columns and trigger are in place!';
        RAISE NOTICE '✅ Device status updates to repair-complete should work now!';
    ELSE
        RAISE NOTICE '❌ Some components are missing:';
        RAISE NOTICE '   repair_cost column: %', repair_cost_exists;
        RAISE NOTICE '   deposit_amount column: %', deposit_amount_exists;
        RAISE NOTICE '   trigger: %', trigger_exists;
    END IF;
END $$;