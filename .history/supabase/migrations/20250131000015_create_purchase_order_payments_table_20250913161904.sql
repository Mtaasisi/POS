-- Create purchase_order_payments table for tracking PO payments
-- Migration: 20250131000015_create_purchase_order_payments_table.sql

-- Purchase order payments table
CREATE TABLE IF NOT EXISTS purchase_order_payments (
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
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_po_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_account_id ON purchase_order_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_status ON purchase_order_payments(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_payment_date ON purchase_order_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_created_at ON purchase_order_payments(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_purchase_order_payments_updated_at
    BEFORE UPDATE ON purchase_order_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;

-- Admin can manage all purchase order payments
CREATE POLICY "Admin can manage all purchase order payments" ON purchase_order_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- Users can view purchase order payments for their organization
CREATE POLICY "Users can view purchase order payments" ON purchase_order_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_payments.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can create purchase order payments
CREATE POLICY "Users can create purchase order payments" ON purchase_order_payments
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_payments.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can update their own purchase order payments
CREATE POLICY "Users can update their purchase order payments" ON purchase_order_payments
    FOR UPDATE USING (
        created_by = auth.uid()
    );

-- Add payment tracking columns to purchase orders table
ALTER TABLE lats_purchase_orders ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_purchase_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

-- Create function to update payment status on purchase orders
CREATE OR REPLACE FUNCTION update_purchase_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update payment status when payments are added/updated/deleted
    UPDATE lats_purchase_orders 
    SET 
        total_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM purchase_order_payments 
            WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
            AND status = 'completed'
        ),
        payment_status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM purchase_order_payments 
                WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
                AND status = 'completed'
            ) = 0 THEN 'unpaid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM purchase_order_payments 
                WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
                AND status = 'completed'
            ) >= total_amount THEN 'paid'
            ELSE 'partial'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update payment status
CREATE TRIGGER update_po_payment_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_payments
    FOR EACH ROW EXECUTE FUNCTION update_purchase_order_payment_status();
