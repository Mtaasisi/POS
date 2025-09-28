-- Create multiple payments support
-- Migration: 20250131000015_create_multiple_payments_support.sql

-- Create payment_sessions table to group multiple payments
CREATE TABLE IF NOT EXISTS payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type VARCHAR(50) NOT NULL, -- 'device_repair', 'pos_sale', 'customer_payment'
    total_amount NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) DEFAULT 0,
    balance_due NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    sale_id VARCHAR(255), -- For POS sales
    description TEXT,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add session_id to customer_payments table
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES payment_sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_customer_id ON payment_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_device_id ON payment_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON payment_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_payments_session_id ON customer_payments(session_id);

-- Enable Row Level Security
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON payment_sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON payment_sessions TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_payment_sessions_updated_at 
    BEFORE UPDATE ON payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update payment session totals
CREATE OR REPLACE FUNCTION update_payment_session_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the payment session totals when a payment is added/updated/deleted
    UPDATE payment_sessions 
    SET 
        amount_paid = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM customer_payments 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
            AND status = 'completed'
        ),
        balance_due = total_amount - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM customer_payments 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
            AND status = 'completed'
        ),
        status = CASE 
            WHEN total_amount <= (
                SELECT COALESCE(SUM(amount), 0) 
                FROM customer_payments 
                WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
                AND status = 'completed'
            ) THEN 'completed'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM customer_payments 
                WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
                AND status = 'completed'
            ) > 0 THEN 'partial'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update payment session totals
CREATE TRIGGER trigger_update_payment_session_totals
    AFTER INSERT OR UPDATE OR DELETE ON customer_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_session_totals();

-- Create view for payment session summary
CREATE OR REPLACE VIEW payment_session_summary AS
SELECT 
    ps.id,
    ps.session_type,
    ps.total_amount,
    ps.amount_paid,
    ps.balance_due,
    ps.status,
    ps.customer_id,
    ps.device_id,
    ps.sale_id,
    ps.description,
    ps.created_at,
    ps.completed_at,
    c.name as customer_name,
    d.brand || ' ' || d.model as device_name,
    COUNT(cp.id) as payment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'id', cp.id,
            'amount', cp.amount,
            'method', cp.method,
            'status', cp.status,
            'payment_date', cp.payment_date,
            'reference', cp.reference,
            'notes', cp.notes
        ) ORDER BY cp.payment_date
    ) as payments
FROM payment_sessions ps
LEFT JOIN customers c ON ps.customer_id = c.id
LEFT JOIN devices d ON ps.device_id = d.id
LEFT JOIN customer_payments cp ON ps.id = cp.session_id
GROUP BY ps.id, ps.session_type, ps.total_amount, ps.amount_paid, ps.balance_due, 
         ps.status, ps.customer_id, ps.device_id, ps.sale_id, ps.description, 
         ps.created_at, ps.completed_at, c.name, d.brand, d.model;

-- Grant permissions on the view
GRANT SELECT ON payment_session_summary TO authenticated;
