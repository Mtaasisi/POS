-- CRITICAL PAYMENT SYSTEM FIXES
-- Run this SQL in your Supabase SQL Editor to fix all payment issues

-- =====================================================
-- 1. FIX AUTH USERS TABLE CONFLICTS
-- =====================================================

-- Ensure auth_users table exists and is properly configured
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    username TEXT,
    name TEXT,
    role TEXT DEFAULT 'technician',
    is_active BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proper indexes
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);

-- Enable RLS with permissive policies
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for auth_users" ON auth_users;
CREATE POLICY "Enable all access for auth_users" ON auth_users FOR ALL USING (true);

-- =====================================================
-- 2. FIX PURCHASE ORDER PAYMENTS TABLE
-- =====================================================

-- Drop and recreate purchase_order_payments table with correct schema
DROP TABLE IF EXISTS purchase_order_payments CASCADE;

CREATE TABLE purchase_order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    payment_account_id UUID NOT NULL REFERENCES finance_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    payment_method VARCHAR(100) NOT NULL,
    payment_method_id UUID NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchase_order_payments_po_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX idx_purchase_order_payments_account_id ON purchase_order_payments(payment_account_id);
CREATE INDEX idx_purchase_order_payments_status ON purchase_order_payments(status);

-- Enable RLS
ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for purchase_order_payments" ON purchase_order_payments;
CREATE POLICY "Enable all access for purchase_order_payments" ON purchase_order_payments FOR ALL USING (true);

-- =====================================================
-- 3. FIX RPC FUNCTION WITH CORRECT SCHEMA
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
);

-- Create corrected RPC function
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    user_id_param UUID,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    account_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    new_payment_status VARCHAR(20);
    amount_in_tzs DECIMAL(15,2);
    original_amount DECIMAL(15,2);
    original_currency VARCHAR(3);
    account_balance_in_tzs DECIMAL(15,2);
    deduction_amount DECIMAL(15,2);
    valid_user_id UUID;
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, payment_status, exchange_rate
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Validate payment account exists
    SELECT id, balance, currency
    INTO account_record
    FROM finance_accounts 
    WHERE id = payment_account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment account % not found', payment_account_id_param;
    END IF;
    
    -- Store original amount and currency
    original_amount := amount_param;
    original_currency := currency_param;
    
    -- Convert to TZS if payment is in foreign currency
    IF currency_param != 'TZS' THEN
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            amount_in_tzs := amount_param * order_record.exchange_rate;
            RAISE NOTICE 'Converting % % to TZS using exchange rate %: % TZS', 
                original_amount, original_currency, order_record.exchange_rate, amount_in_tzs;
        ELSE
            RAISE EXCEPTION 'Exchange rate not available for purchase order. Cannot convert % to TZS', currency_param;
        END IF;
    ELSE
        amount_in_tzs := amount_param;
    END IF;
    
    -- Check account balance (convert to TZS for comparison)
    IF account_record.currency = 'TZS' THEN
        account_balance_in_tzs := account_record.balance;
    ELSE
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            account_balance_in_tzs := account_record.balance * order_record.exchange_rate;
        ELSE
            account_balance_in_tzs := account_record.balance;
        END IF;
    END IF;
    
    IF account_balance_in_tzs < amount_in_tzs THEN
        RAISE EXCEPTION 'Insufficient balance. Available: % TZS, Required: % TZS (from % %)', 
            account_balance_in_tzs, amount_in_tzs, original_amount, original_currency;
    END IF;
    
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + amount_in_tzs;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        new_payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        new_payment_status := 'partial';
    ELSE
        new_payment_status := 'unpaid';
    END IF;
    
    -- Get a valid user ID from auth_users table
    valid_user_id := user_id_param;
    
    -- If user_id_param is null or invalid, get a valid user from auth_users
    IF valid_user_id IS NULL OR valid_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        SELECT id INTO valid_user_id FROM auth_users LIMIT 1;
        IF NOT FOUND THEN
            -- Use the default admin user ID as fallback
            valid_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        END IF;
    END IF;
    
    -- Update finance account balance (use converted amount for account currency)
    UPDATE finance_accounts 
    SET balance = balance - converted_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Insert payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        payment_account_id,
        amount,
        currency,
        payment_method,
        payment_method_id,
        reference,
        notes,
        status,
        payment_date,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        payment_account_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        payment_method_id_param,
        reference_param,
        notes_param,
        'completed',
        NOW(),
        valid_user_id,
        NOW()
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET total_paid = new_paid,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in process_purchase_order_payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
) TO authenticated;

-- =====================================================
-- 4. ENSURE PURCHASE ORDERS HAVE REQUIRED COLUMNS
-- =====================================================

ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid')),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,4) DEFAULT 1.0;

-- =====================================================
-- 5. ENSURE AUTH USER EXISTS (handle existing users)
-- =====================================================

-- Check if any auth_users exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth_users LIMIT 1) THEN
        -- No users exist, create the default admin user
        INSERT INTO auth_users (id, email, username, name, role) 
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'admin@lats.com',
            'admin',
            'System Administrator',
            'admin'
        );
        RAISE NOTICE 'Created default admin user';
    ELSE
        RAISE NOTICE 'Auth users already exist, skipping user creation';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'auth_users' as table_name, COUNT(*) as record_count FROM auth_users;
SELECT 'purchase_order_payments' as table_name, COUNT(*) as record_count FROM purchase_order_payments;
SELECT 'finance_accounts' as table_name, COUNT(*) as record_count FROM finance_accounts;

-- Verify function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'process_purchase_order_payment';

-- Verify purchase orders have required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lats_purchase_orders' 
AND column_name IN ('total_paid', 'payment_status', 'exchange_rate')
ORDER BY column_name;
