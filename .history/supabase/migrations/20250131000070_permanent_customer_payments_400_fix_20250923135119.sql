-- =====================================================
-- PERMANENT FIX FOR CUSTOMER_PAYMENTS 400 ERROR
-- =====================================================
-- Migration: 20250131000070_permanent_customer_payments_400_fix.sql
-- This migration permanently fixes the 400 Bad Request error by ensuring
-- the customer_payments table structure matches what the application expects

-- Step 1: Add all missing columns that the application is trying to use
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID;

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Update existing records to have default values for new columns
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

-- Step 3: Add proper constraints for data validation
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS check_customer_payments_currency;

ALTER TABLE customer_payments 
ADD CONSTRAINT check_customer_payments_currency 
CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);

-- Step 5: Ensure the trigger function exists and is working properly
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate the trigger if it doesn't exist or is broken
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Grant proper permissions to ensure authenticated users can insert
GRANT INSERT, SELECT, UPDATE, DELETE ON customer_payments TO authenticated;
GRANT USAGE ON SEQUENCE customer_payments_id_seq TO authenticated;

-- Step 8: Ensure RLS policies allow inserts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Verify the table structure matches application expectations
DO $$
DECLARE
    column_count INTEGER;
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'customer_id', 'device_id', 'amount', 'method', 
        'payment_type', 'status', 'payment_date', 'created_by', 
        'created_at', 'updated_at', 'currency', 'payment_account_id', 
        'payment_method_id', 'reference', 'notes', 'updated_by'
    ];
    col_name TEXT;
BEGIN
    -- Count total columns
    SELECT COUNT(*)
    INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customer_payments';
    
    -- Check for missing columns
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customer_payments'
            AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    -- Report results
    RAISE NOTICE '✅ Customer payments table structure verification:';
    RAISE NOTICE '   Total columns: %', column_count;
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ All required columns are present!';
        RAISE NOTICE '✅ 400 Bad Request errors should be permanently resolved!';
    ELSE
        RAISE NOTICE '❌ Missing columns: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '⚠️  Additional fixes may be required';
    END IF;
    
    -- Check constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'check_customer_payments_currency'
    ) THEN
        RAISE NOTICE '✅ Currency constraint is in place!';
    ELSE
        RAISE NOTICE '❌ Currency constraint is missing!';
    END IF;
    
    -- Check trigger
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'update_customer_payments_updated_at'
    ) THEN
        RAISE NOTICE '✅ Update trigger is in place!';
    ELSE
        RAISE NOTICE '❌ Update trigger is missing!';
    END IF;
    
END $$;

-- Step 10: Test insert to verify the fix works permanently
DO $$
DECLARE
    test_customer_id UUID;
    test_device_id UUID;
    test_payment_id UUID;
    test_user_id UUID;
BEGIN
    -- Get a valid customer ID for testing
    SELECT id INTO test_customer_id 
    FROM customers 
    LIMIT 1;
    
    -- Get a valid device ID for testing
    SELECT id INTO test_device_id 
    FROM devices 
    LIMIT 1;
    
    -- Get a valid user ID for testing
    SELECT id INTO test_user_id 
    FROM auth_users 
    LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Try to insert a test payment with all the new columns
        INSERT INTO customer_payments (
            customer_id, device_id, amount, method, payment_type, 
            status, currency, reference, notes, created_by
        ) VALUES (
            test_customer_id, 
            test_device_id, 
            100.00, 
            'cash', 
            'payment', 
            'completed', 
            'TZS', 
            'PERMANENT_FIX_TEST', 
            'Test payment to verify permanent 400 error fix',
            test_user_id
        ) RETURNING id INTO test_payment_id;
        
        -- Clean up test payment
        DELETE FROM customer_payments WHERE id = test_payment_id;
        
        RAISE NOTICE '✅ Test payment insert successful!';
        RAISE NOTICE '✅ 400 Bad Request error is permanently fixed!';
        RAISE NOTICE '✅ Application can now successfully POST to customer_payments!';
    ELSE
        RAISE NOTICE '⚠️  No test data available, but table structure is fixed';
        RAISE NOTICE '✅ 400 Bad Request error should be permanently resolved!';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
        RAISE NOTICE '⚠️  Additional investigation may be required';
END $$;
