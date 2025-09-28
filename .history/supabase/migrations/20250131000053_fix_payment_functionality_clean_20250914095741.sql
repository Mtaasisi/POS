-- =====================================================
-- PAYMENT FUNCTIONALITY MIGRATION - CLEAN VERSION
-- =====================================================

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    account_id UUID REFERENCES finance_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, description, account_id) VALUES
    ('Cash Payment', 'Cash payment method', (SELECT id FROM finance_accounts WHERE name = 'Cash' LIMIT 1)),
    ('Bank Transfer', 'Bank transfer payment method', (SELECT id FROM finance_accounts WHERE name = 'CRDB' LIMIT 1)),
    ('Card Payment', 'Card payment method', (SELECT id FROM finance_accounts WHERE name = 'Card' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add foreign key to purchase_order_payments
ALTER TABLE purchase_order_payments 
    ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Add payment status columns to purchase orders
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0;

ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';

-- Add check constraint for payment status (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_payment_status' 
        AND table_name = 'lats_purchase_orders'
    ) THEN
        ALTER TABLE lats_purchase_orders 
        ADD CONSTRAINT check_payment_status 
        CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));
    END IF;
END $$;

-- Update existing purchase orders
UPDATE lats_purchase_orders 
SET total_paid = 0, payment_status = 'unpaid' 
WHERE total_paid IS NULL OR payment_status IS NULL;

-- =====================================================
-- PAYMENT PROCESSING FUNCTIONS
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
    
    -- Check account balance
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
    
    -- Update finance account balance
    UPDATE finance_accounts 
    SET balance = balance - amount_param,
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
        user_id_param,
        NOW()
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET total_paid = new_paid,
        payment_status = payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        details,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'payment_processed',
        json_build_object(
            'amount', amount_param,
            'currency', currency_param,
            'payment_method', payment_method_param,
            'new_total_paid', new_paid,
            'payment_status', payment_status
        ),
        user_id_param,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment summary
CREATE OR REPLACE FUNCTION get_purchase_order_payment_summary(purchase_order_id_param UUID)
RETURNS TABLE (
    total_amount DECIMAL(15,2),
    total_paid DECIMAL(15,2),
    remaining_amount DECIMAL(15,2),
    payment_status VARCHAR(20),
    payment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        po.total_amount,
        COALESCE(po.total_paid, 0) as total_paid,
        (po.total_amount - COALESCE(po.total_paid, 0)) as remaining_amount,
        po.payment_status,
        COUNT(pop.id)::INTEGER as payment_count
    FROM lats_purchase_orders po
    LEFT JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id
    WHERE po.id = purchase_order_id_param
    GROUP BY po.id, po.total_amount, po.total_paid, po.payment_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment history
CREATE OR REPLACE FUNCTION get_purchase_order_payment_history(purchase_order_id_param UUID)
RETURNS TABLE (
    id UUID,
    amount DECIMAL(15,2),
    currency VARCHAR(3),
    payment_method VARCHAR(100),
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
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
        pop.created_at,
        pop.created_by
    FROM purchase_order_payments pop
    WHERE pop.purchase_order_id = purchase_order_id_param
    ORDER BY pop.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_payment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_payment_history TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment functionality migration completed successfully';
    RAISE NOTICE 'New tables created: payment_methods';
    RAISE NOTICE 'New functions created:';
    RAISE NOTICE '   - process_purchase_order_payment()';
    RAISE NOTICE '   - get_purchase_order_payment_summary()';
    RAISE NOTICE '   - get_purchase_order_payment_history()';
    RAISE NOTICE 'Default payment methods created';
    RAISE NOTICE 'Purchase order payment tracking enabled';
END $$;
