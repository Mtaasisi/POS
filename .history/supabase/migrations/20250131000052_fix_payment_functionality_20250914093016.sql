-- Fix Payment Functionality
-- This migration addresses payment system issues

-- =====================================================
-- CREATE MISSING PAYMENT METHODS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'bank_transfer', 'card', 'mobile_money', 'check', 'other')),
    account_id UUID REFERENCES finance_accounts(id),
    is_active BOOLEAN DEFAULT true,
    requires_reference BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    max_amount DECIMAL(15,2),
    min_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TZS',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, account_id, currency, description) VALUES
('Cash Payment', 'cash', (SELECT id FROM finance_accounts WHERE name = 'Cash' LIMIT 1), 'TZS', 'Cash payment method'),
('Bank Transfer', 'bank_transfer', (SELECT id FROM finance_accounts WHERE name = 'CRDB' LIMIT 1), 'TZS', 'Bank transfer payment'),
('Card Payment', 'card', (SELECT id FROM finance_accounts WHERE name = 'Card' LIMIT 1), 'TZS', 'Card payment method')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ADD INDEXES FOR PAYMENT METHODS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_account_id ON payment_methods(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- =====================================================
-- ENABLE RLS FOR PAYMENT METHODS
-- =====================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read payment methods" ON payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Users can insert payment methods" ON payment_methods
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update payment methods" ON payment_methods
    FOR UPDATE USING (true);

-- =====================================================
-- FIX PURCHASE ORDER PAYMENTS TABLE
-- =====================================================

-- Fix foreign key reference to use auth_users instead of auth.users
ALTER TABLE purchase_order_payments 
    DROP CONSTRAINT IF EXISTS purchase_order_payments_created_by_fkey;

ALTER TABLE purchase_order_payments 
    ADD CONSTRAINT purchase_order_payments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE SET NULL;

-- =====================================================
-- ADD PAYMENT STATUS TRACKING TO PURCHASE ORDERS
-- =====================================================

-- Add payment status columns if they don't exist
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));

-- =====================================================
-- CREATE PAYMENT PROCESSING FUNCTIONS
-- =====================================================

-- Function to process purchase order payment
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
    payment_status VARCHAR(20);
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, payment_status
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
    
    -- Check account balance (simplified - no currency conversion for now)
    IF account_record.balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient balance in account. Available: %, Required: %', 
            account_record.balance, amount_param;
    END IF;
    
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + amount_param;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        payment_status := 'partial';
    ELSE
        payment_status := 'unpaid';
    END IF;
    
    -- Create payment record
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
        created_by
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
        user_id_param
    );
    
    -- Update account balance
    UPDATE finance_accounts 
    SET 
        balance = balance - amount_param,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET 
        total_paid = new_paid,
        payment_status = payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        user_id,
        details,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'Payment processed',
        user_id_param,
        format('Payment of %s %s processed via %s', amount_param, currency_param, payment_method_param),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment summary for purchase order
CREATE OR REPLACE FUNCTION get_purchase_order_payment_summary(purchase_order_id_param UUID)
RETURNS TABLE (
    total_amount DECIMAL(15,2),
    total_paid DECIMAL(15,2),
    remaining_amount DECIMAL(15,2),
    payment_status VARCHAR(20),
    payment_count INTEGER,
    last_payment_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        po.total_amount,
        COALESCE(po.total_paid, 0) as total_paid,
        po.total_amount - COALESCE(po.total_paid, 0) as remaining_amount,
        po.payment_status,
        COUNT(pop.id)::INTEGER as payment_count,
        MAX(pop.payment_date) as last_payment_date
    FROM lats_purchase_orders po
    LEFT JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id
    WHERE po.id = purchase_order_id_param
    GROUP BY po.id, po.total_amount, po.total_paid, po.payment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment history for purchase order
CREATE OR REPLACE FUNCTION get_purchase_order_payment_history(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    amount DECIMAL(15,2),
    currency VARCHAR(3),
    payment_method VARCHAR(100),
    reference VARCHAR(255),
    notes TEXT,
    status VARCHAR(20),
    payment_date TIMESTAMPTZ,
    account_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pop.id,
        pop.amount,
        pop.currency,
        pop.payment_method,
        pop.reference,
        pop.notes,
        pop.status,
        pop.payment_date,
        fa.name as account_name
    FROM purchase_order_payments pop
    JOIN finance_accounts fa ON pop.payment_account_id = fa.id
    WHERE pop.purchase_order_id = purchase_order_id_param
    ORDER BY pop.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION process_purchase_order_payment(UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, VARCHAR(255), TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_payment_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_payment_history(UUID) TO authenticated;

-- =====================================================
-- UPDATE EXISTING PURCHASE ORDERS
-- =====================================================

-- Update existing purchase orders to have proper payment status
UPDATE lats_purchase_orders 
SET 
    total_paid = 0,
    payment_status = 'unpaid'
WHERE total_paid IS NULL OR payment_status IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Payment functionality migration completed successfully';
    RAISE NOTICE '📋 New tables created:';
    RAISE NOTICE '   - payment_methods';
    RAISE NOTICE '🔧 New functions created:';
    RAISE NOTICE '   - process_purchase_order_payment()';
    RAISE NOTICE '   - get_purchase_order_payment_summary()';
    RAISE NOTICE '   - get_purchase_order_payment_history()';
    RAISE NOTICE '💰 Default payment methods created';
    RAISE NOTICE '📊 Purchase order payment tracking enabled';
END $$;
