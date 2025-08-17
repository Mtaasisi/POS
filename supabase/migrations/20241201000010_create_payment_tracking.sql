-- Payment tracking tables for LATS system
-- Migration: 20241201000010_create_payment_tracking.sql

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'zenopay', 'stripe', 'flutterwave', etc.
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    customer_id VARCHAR(255),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    reference VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    sale_id VARCHAR(255), -- Link to sale record
    pos_session_id VARCHAR(255)
);

-- Payment webhooks table
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'payment.completed', 'payment.failed', etc.
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment analytics table (for caching aggregated data)
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    pending_transactions INTEGER DEFAULT 0,
    average_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, provider)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_email ON payment_transactions(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_transaction_id ON payment_webhooks(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

CREATE INDEX IF NOT EXISTS idx_payment_analytics_date_provider ON payment_analytics(date, provider);

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can manage payment transactions" ON payment_transactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage payment webhooks" ON payment_webhooks
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage payment analytics" ON payment_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Customer care can view transactions
CREATE POLICY "Customer care can view payment transactions" ON payment_transactions
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'customer-care'));

CREATE POLICY "Customer care can view payment analytics" ON payment_analytics
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'customer-care'));

-- Functions for analytics
CREATE OR REPLACE FUNCTION update_payment_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics when payment status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Update daily analytics
        INSERT INTO payment_analytics (date, provider, total_transactions, total_amount, successful_transactions, failed_transactions, pending_transactions, average_amount)
        SELECT 
            DATE(NEW.created_at),
            NEW.provider,
            COUNT(*),
            SUM(amount),
            COUNT(*) FILTER (WHERE status = 'completed'),
            COUNT(*) FILTER (WHERE status = 'failed'),
            COUNT(*) FILTER (WHERE status = 'pending'),
            AVG(amount)
        FROM payment_transactions 
        WHERE DATE(created_at) = DATE(NEW.created_at) AND provider = NEW.provider
        ON CONFLICT (date, provider) DO UPDATE SET
            total_transactions = EXCLUDED.total_transactions,
            total_amount = EXCLUDED.total_amount,
            successful_transactions = EXCLUDED.successful_transactions,
            failed_transactions = EXCLUDED.failed_transactions,
            pending_transactions = EXCLUDED.pending_transactions,
            average_amount = EXCLUDED.average_amount,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics
CREATE TRIGGER payment_analytics_trigger
    AFTER INSERT OR UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_analytics();
