-- =====================================================
-- PAYMENT FUNCTIONALITY MIGRATION - FINAL CLEAN VERSION
-- =====================================================

-- Create audit table for purchase order tracking

CREATE TABLE IF NOT EXISTS lats_purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON lats_purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_created_at ON lats_purchase_order_audit(created_at);

-- Enable RLS on audit table
ALTER TABLE lats_purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON lats_purchase_order_audit;
    DROP POLICY IF EXISTS "Users can view audit records" ON lats_purchase_order_audit;
    DROP POLICY IF EXISTS "audit_select_policy" ON lats_purchase_order_audit;
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, ignore
        NULL;
END $$;

-- Create the policy
CREATE POLICY "Users can view audit records for their purchase orders" ON lats_purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

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

-- Add check constraint for payment status
ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));

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
    converted_amount DECIMAL(15,2);
    exchange_rate DECIMAL(15,4);
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, lats_purchase_orders.payment_status, lats_purchase_orders.exchange_rate
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
    
    -- Handle currency conversion if needed
    converted_amount := amount_param;
    IF currency_param != account_record.currency THEN
        -- Use exchange rate from purchase order if available
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            -- Convert payment currency to account currency using PO exchange rate
            IF currency_param = order_record.currency THEN
                -- Payment is in PO currency, convert to account currency
                IF account_record.currency = 'TZS' THEN
                    converted_amount := amount_param * order_record.exchange_rate;
                ELSE
                    -- Account is in foreign currency, convert from PO currency
                    converted_amount := amount_param / order_record.exchange_rate;
                END IF;
            ELSE
                -- Payment is in different currency than PO, use simple conversion
                -- For now, assume 1:1 conversion for non-matching currencies
                -- This should be enhanced with proper exchange rate lookup
                converted_amount := amount_param;
            END IF;
        ELSE
            -- No exchange rate available, use 1:1 conversion as fallback
            converted_amount := amount_param;
        END IF;
    END IF;
    
    -- Check account balance with converted amount
    IF account_record.balance < converted_amount THEN
        RAISE EXCEPTION 'Insufficient balance in account. Available: % %, Required: % % (converted from % % %)', 
            account_record.balance, account_record.currency, converted_amount, account_record.currency, amount_param, currency_param, 
            CASE WHEN currency_param != account_record.currency THEN 'using exchange rate' ELSE '' END;
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
        user_id,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'payment_processed',
        json_build_object(
            'amount', amount_param,
            'currency', currency_param,
            'converted_amount', converted_amount,
            'account_currency', account_record.currency,
            'payment_method', payment_method_param,
            'new_total_paid', new_paid,
            'payment_status', payment_status,
            'currency_conversion', CASE WHEN currency_param != account_record.currency THEN 'yes' ELSE 'no' END
        ),
        user_id_param,
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

