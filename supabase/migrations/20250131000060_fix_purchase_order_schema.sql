-- Fix Purchase Order Database Schema Issues
-- This migration addresses all critical database schema problems

-- =====================================================
-- CREATE MISSING TABLES
-- =====================================================

-- Purchase Order Messages Table
CREATE TABLE IF NOT EXISTS purchase_order_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'user', 'supplier')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Payments Table
CREATE TABLE IF NOT EXISTS purchase_order_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TZS',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    reference TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Audit Table
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank_transfer', 'mobile_money', 'credit_card', 'check')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FIX EXISTING TABLES
-- =====================================================

-- Add missing columns to newly created tables (in case they existed before)
ALTER TABLE purchase_order_messages
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE purchase_order_payments
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE purchase_order_audit
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add missing updated_at column to lats_purchase_order_items
ALTER TABLE lats_purchase_order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to lats_purchase_orders
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_info JSONB,
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS quality_check_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS quality_check_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quality_check_notes TEXT,
ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_lats_purchase_orders_updated_at ON lats_purchase_orders;
DROP TRIGGER IF EXISTS update_lats_purchase_order_items_updated_at ON lats_purchase_order_items;
DROP TRIGGER IF EXISTS update_purchase_order_messages_updated_at ON purchase_order_messages;
DROP TRIGGER IF EXISTS update_purchase_order_payments_updated_at ON purchase_order_payments;
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;

-- Add triggers for updated_at columns
CREATE TRIGGER update_lats_purchase_orders_updated_at
    BEFORE UPDATE ON lats_purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lats_purchase_order_items_updated_at
    BEFORE UPDATE ON lats_purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_messages_updated_at
    BEFORE UPDATE ON purchase_order_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_payments_updated_at
    BEFORE UPDATE ON purchase_order_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIX FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS lats_purchase_orders 
    DROP CONSTRAINT IF EXISTS lats_purchase_orders_supplier_id_fkey;

-- Add proper foreign key constraint for purchase orders to suppliers
ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT lats_purchase_orders_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES lats_suppliers(id) ON DELETE CASCADE;

-- Add foreign key constraints for purchase order items
ALTER TABLE IF EXISTS lats_purchase_order_items 
    DROP CONSTRAINT IF EXISTS lats_purchase_order_items_product_id_fkey;

ALTER TABLE IF EXISTS lats_purchase_order_items 
    DROP CONSTRAINT IF EXISTS lats_purchase_order_items_variant_id_fkey;

ALTER TABLE lats_purchase_order_items 
    ADD CONSTRAINT lats_purchase_order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES lats_products(id) ON DELETE CASCADE;

ALTER TABLE lats_purchase_order_items 
    ADD CONSTRAINT lats_purchase_order_items_variant_id_fkey 
    FOREIGN KEY (variant_id) REFERENCES lats_product_variants(id) ON DELETE CASCADE;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Purchase Order Messages indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_order_id ON purchase_order_messages(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_timestamp ON purchase_order_messages(timestamp);

-- Purchase Order Payments indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_order_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_status ON purchase_order_payments(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_timestamp ON purchase_order_payments(timestamp);

-- Purchase Order Audit indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_user_id ON purchase_order_audit(user_id);

-- Purchase Order Items indexes
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_order_id ON lats_purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_product_id ON lats_purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_purchase_order_items_variant_id ON lats_purchase_order_items(variant_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE purchase_order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages for their purchase orders" ON purchase_order_messages;
DROP POLICY IF EXISTS "Users can create messages for their purchase orders" ON purchase_order_messages;
DROP POLICY IF EXISTS "Users can view payments for their purchase orders" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can create payments for their purchase orders" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Anyone can view payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON payment_methods;

-- Purchase Order Messages policies
CREATE POLICY "Users can view messages for their purchase orders" ON purchase_order_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their purchase orders" ON purchase_order_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Purchase Order Payments policies
CREATE POLICY "Users can view payments for their purchase orders" ON purchase_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create payments for their purchase orders" ON purchase_order_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Purchase Order Audit policies
CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

-- Payment Methods policies (public read, admin write)
CREATE POLICY "Anyone can view payment methods" ON payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage payment methods" ON payment_methods
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default payment methods
INSERT INTO payment_methods (name, type) VALUES
    ('Cash', 'cash'),
    ('Bank Transfer', 'bank_transfer'),
    ('M-Pesa', 'mobile_money'),
    ('Tigo Pesa', 'mobile_money'),
    ('Airtel Money', 'mobile_money'),
    ('Credit Card', 'credit_card'),
    ('Check', 'check')
ON CONFLICT DO NOTHING;

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to process purchase order payments
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    p_purchase_order_id UUID,
    p_method TEXT,
    p_amount DECIMAL,
    p_currency TEXT DEFAULT 'TZS',
    p_reference TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment_id UUID;
    v_order_total DECIMAL;
    v_total_paid DECIMAL;
    v_payment_status TEXT;
BEGIN
    -- Get order total
    SELECT total_amount INTO v_order_total
    FROM lats_purchase_orders
    WHERE id = p_purchase_order_id;

    -- Get current total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM purchase_order_payments
    WHERE purchase_order_id = p_purchase_order_id
    AND status = 'completed';

    -- Insert payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        method,
        amount,
        currency,
        status,
        reference,
        timestamp
    ) VALUES (
        p_purchase_order_id,
        p_method,
        p_amount,
        p_currency,
        'completed',
        p_reference,
        NOW()
    ) RETURNING id INTO v_payment_id;

    -- Update order payment status
    IF (v_total_paid + p_amount) >= v_order_total THEN
        v_payment_status := 'paid';
    ELSE
        v_payment_status := 'partial';
    END IF;

    UPDATE lats_purchase_orders
    SET 
        total_paid = v_total_paid + p_amount,
        payment_status = v_payment_status,
        updated_at = NOW()
    WHERE id = p_purchase_order_id;

    -- Add audit entry
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by
    ) VALUES (
        p_purchase_order_id,
        'payment_added',
        jsonb_build_object(
            'payment_id', v_payment_id,
            'method', p_method,
            'amount', p_amount,
            'currency', p_currency,
            'reference', p_reference,
            'new_payment_status', v_payment_status
        ),
        COALESCE(p_user_id, auth.uid()),
        COALESCE(p_user_id, auth.uid())
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_status', v_payment_status,
        'total_paid', v_total_paid + p_amount,
        'order_total', v_order_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment summary
CREATE OR REPLACE FUNCTION get_purchase_order_payment_summary(p_purchase_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order_total DECIMAL;
    v_total_paid DECIMAL;
    v_payment_status TEXT;
    v_payments JSONB;
BEGIN
    -- Get order total
    SELECT total_amount INTO v_order_total
    FROM lats_purchase_orders
    WHERE id = p_purchase_order_id;

    -- Get current total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM purchase_order_payments
    WHERE purchase_order_id = p_purchase_order_id
    AND status = 'completed';

    -- Get payment status
    IF v_total_paid >= v_order_total THEN
        v_payment_status := 'paid';
    ELSIF v_total_paid > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- Get payment history
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'method', method,
            'amount', amount,
            'currency', currency,
            'status', status,
            'reference', reference,
            'timestamp', timestamp
        )
    ) INTO v_payments
    FROM purchase_order_payments
    WHERE purchase_order_id = p_purchase_order_id
    ORDER BY timestamp DESC;

    RETURN jsonb_build_object(
        'order_total', v_order_total,
        'total_paid', v_total_paid,
        'remaining_amount', v_order_total - v_total_paid,
        'payment_status', v_payment_status,
        'payments', COALESCE(v_payments, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update purchase order status
CREATE OR REPLACE FUNCTION update_purchase_order_status(
    p_purchase_order_id UUID,
    p_status TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status
    FROM lats_purchase_orders
    WHERE id = p_purchase_order_id;

    -- Update status
    UPDATE lats_purchase_orders
    SET 
        status = p_status,
        updated_at = NOW()
    WHERE id = p_purchase_order_id;

    -- Add audit entry
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by
    ) VALUES (
        p_purchase_order_id,
        'status_updated',
        jsonb_build_object(
            'old_status', v_old_status,
            'new_status', p_status
        ),
        COALESCE(p_user_id, auth.uid()),
        COALESCE(p_user_id, auth.uid())
    );

    RETURN jsonb_build_object(
        'success', true,
        'old_status', v_old_status,
        'new_status', p_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
