-- Fix payment workflow issues
-- Ensure proper payment processing in device workflow

-- Create function to validate device payments before handover
CREATE OR REPLACE FUNCTION validate_device_payments(device_id UUID)
RETURNS TABLE (
  can_handover BOOLEAN,
  total_cost DECIMAL(10,2),
  total_paid DECIMAL(10,2),
  amount_due DECIMAL(10,2),
  message TEXT
) AS $$
DECLARE
  device_record RECORD;
  total_cost DECIMAL(10,2) := 0;
  total_paid DECIMAL(10,2) := 0;
  amount_due DECIMAL(10,2) := 0;
  can_handover BOOLEAN := FALSE;
  message TEXT := '';
BEGIN
  -- Get device information
  SELECT repair_cost, deposit_amount, repair_price
  INTO device_record
  FROM devices
  WHERE id = device_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Device not found'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate total cost (use repair_price if available, otherwise repair_cost)
  total_cost := COALESCE(device_record.repair_price, device_record.repair_cost, 0);
  
  -- Calculate total paid from customer_payments
  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM customer_payments
  WHERE device_id = device_id
    AND status = 'completed'
    AND payment_type = 'payment';
  
  -- Calculate amount due
  amount_due := total_cost - total_paid;
  
  -- Determine if handover is allowed
  IF total_cost = 0 THEN
    can_handover := TRUE;
    message := 'No payment required';
  ELSIF amount_due <= 0 THEN
    can_handover := TRUE;
    message := 'Payment completed';
  ELSE
    can_handover := FALSE;
    message := 'Payment required: ' || amount_due || ' remaining';
  END IF;
  
  RETURN QUERY SELECT can_handover, total_cost, total_paid, amount_due, message;
END;
$$ LANGUAGE plpgsql;

-- Create function to create pending payments when repair is complete
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
    
    -- Get device information
    SELECT repair_cost, deposit_amount, customer_id
    INTO device_record
    FROM devices
    WHERE id = NEW.id;
    
    -- Calculate costs
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

-- Create trigger to automatically create pending payments
DROP TRIGGER IF EXISTS trigger_create_pending_payments ON devices;
CREATE TRIGGER trigger_create_pending_payments
  AFTER UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_payments_on_repair_complete();

-- Add constraint to ensure proper status transitions
-- Note: This constraint should match the devices_status_check constraint
-- to avoid conflicts. The devices_status_check constraint is the primary one.
-- This constraint is redundant and should be removed to prevent conflicts.
-- ALTER TABLE devices 
-- ADD CONSTRAINT check_status_transitions 
-- CHECK (
--   status IN (
--     'assigned', 'diagnosis-started', 'awaiting-admin-review', 'awaiting-parts', 'parts-arrived', 
--     'in-repair', 'reassembled-testing', 'repair-complete', 
--     'process-payments', 'returned-to-customer-care', 'done', 'failed'
--   )
-- );
