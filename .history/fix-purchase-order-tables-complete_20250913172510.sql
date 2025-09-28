-- Complete fix for purchase order tables
-- Run this in your Supabase SQL Editor

-- First, let's ensure the tables exist with the correct structure
-- Drop and recreate purchase_order_messages table
DROP TABLE IF EXISTS purchase_order_messages CASCADE;

CREATE TABLE purchase_order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'user', 'supplier')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_purchase_order_messages_order_id ON purchase_order_messages(purchase_order_id);
CREATE INDEX idx_purchase_order_messages_timestamp ON purchase_order_messages(timestamp DESC);
CREATE INDEX idx_purchase_order_messages_type ON purchase_order_messages(type);

-- Enable RLS
ALTER TABLE purchase_order_messages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Enable all access for purchase_order_messages" ON purchase_order_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Drop and recreate purchase_order_payments table
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
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_purchase_order_payments_po_id ON purchase_order_payments(purchase_order_id);
CREATE INDEX idx_purchase_order_payments_account_id ON purchase_order_payments(payment_account_id);
CREATE INDEX idx_purchase_order_payments_status ON purchase_order_payments(status);
CREATE INDEX idx_purchase_order_payments_payment_date ON purchase_order_payments(payment_date);
CREATE INDEX idx_purchase_order_payments_created_at ON purchase_order_payments(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_order_payments_updated_at
    BEFORE UPDATE ON purchase_order_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Enable all access for purchase_order_payments" ON purchase_order_payments
    FOR ALL USING (true) WITH CHECK (true);

-- Add payment tracking columns to purchase orders table if they don't exist
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
DROP TRIGGER IF EXISTS update_po_payment_status_trigger ON purchase_order_payments;
CREATE TRIGGER update_po_payment_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_payments
    FOR EACH ROW EXECUTE FUNCTION update_purchase_order_payment_status();

-- Verify the tables and policies
SELECT 'Tables created successfully' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('purchase_order_messages', 'purchase_order_payments');
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('purchase_order_messages', 'purchase_order_payments');
