-- =====================================================
-- FIX PAYMENT TRACKING MISSING COMPONENTS
-- =====================================================
-- This migration creates the missing tables and RPC functions
-- that the Payment Tracking Dashboard is trying to access

-- =====================================================
-- CREATE MISSING PAYMENT TABLES
-- =====================================================

-- Create device_payments table (alias for customer_payments with device context)
CREATE TABLE IF NOT EXISTS device_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer')),
    payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'deposit', 'refund')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference VARCHAR(255),
    notes TEXT
);

-- Create repair_payments table (alias for customer_payments with repair context)
CREATE TABLE IF NOT EXISTS repair_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer')),
    payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'deposit', 'refund')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference VARCHAR(255),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_payments_customer_id ON device_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_device_payments_device_id ON device_payments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_payments_payment_date ON device_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_device_payments_status ON device_payments(status);
CREATE INDEX IF NOT EXISTS idx_device_payments_method ON device_payments(method);

CREATE INDEX IF NOT EXISTS idx_repair_payments_customer_id ON repair_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_device_id ON repair_payments(device_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_repair_id ON repair_payments(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_payments_payment_date ON repair_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_repair_payments_status ON repair_payments(status);
CREATE INDEX IF NOT EXISTS idx_repair_payments_method ON repair_payments(method);

-- Enable Row Level Security
ALTER TABLE device_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON device_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON repair_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON device_payments TO authenticated;
GRANT ALL ON repair_payments TO authenticated;

-- Create triggers for updating timestamps
CREATE TRIGGER update_device_payments_updated_at 
    BEFORE UPDATE ON device_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_payments_updated_at 
    BEFORE UPDATE ON repair_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE MISSING RPC FUNCTIONS
-- =====================================================

-- Function to get total revenue summary
CREATE OR REPLACE FUNCTION get_total_revenue_summary()
RETURNS TABLE (
    total_revenue DECIMAL(15,2),
    total_transactions BIGINT,
    average_transaction DECIMAL(10,2),
    currency VARCHAR(3)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as total_transactions,
        COALESCE(AVG(amount), 0) as average_transaction,
        'TZS' as currency
    FROM (
        SELECT amount FROM customer_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM purchase_order_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM payment_transactions WHERE status = 'completed'
    ) all_payments;
END;
$$;

-- Function to get monthly payment trends
CREATE OR REPLACE FUNCTION get_monthly_payment_trends(months_back INTEGER DEFAULT 12)
RETURNS TABLE (
    month_year TEXT,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    currency VARCHAR(3)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(payment_month, 'YYYY-MM') as month_year,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        'TZS' as currency
    FROM (
        SELECT 
            DATE_TRUNC('month', payment_date) as payment_month,
            amount
        FROM customer_payments 
        WHERE status = 'completed' 
        AND payment_date >= NOW() - INTERVAL '1 month' * months_back
        
        UNION ALL
        
        SELECT 
            DATE_TRUNC('month', payment_date) as payment_month,
            amount
        FROM purchase_order_payments 
        WHERE status = 'completed'
        AND payment_date >= NOW() - INTERVAL '1 month' * months_back
        
        UNION ALL
        
        SELECT 
            DATE_TRUNC('month', created_at) as payment_month,
            amount
        FROM payment_transactions 
        WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '1 month' * months_back
    ) all_payments
    GROUP BY payment_month
    ORDER BY payment_month DESC;
END;
$$;

-- Function to get payment method analytics
CREATE OR REPLACE FUNCTION get_payment_method_analytics()
RETURNS TABLE (
    payment_method TEXT,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_all DECIMAL(15,2);
BEGIN
    -- Get total amount for percentage calculation
    SELECT COALESCE(SUM(amount), 0) INTO total_all
    FROM (
        SELECT amount FROM customer_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM purchase_order_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM payment_transactions WHERE status = 'completed'
    ) all_payments;
    
    RETURN QUERY
    SELECT 
        method as payment_method,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        CASE 
            WHEN total_all > 0 THEN (SUM(amount) * 100.0 / total_all)
            ELSE 0
        END as percentage
    FROM (
        SELECT method, amount FROM customer_payments WHERE status = 'completed'
        UNION ALL
        SELECT payment_method as method, amount FROM purchase_order_payments WHERE status = 'completed'
        UNION ALL
        SELECT provider as method, amount FROM payment_transactions WHERE status = 'completed'
    ) all_payments
    GROUP BY method
    ORDER BY total_amount DESC;
END;
$$;

-- Function to get currency usage stats
CREATE OR REPLACE FUNCTION get_currency_usage_stats()
RETURNS TABLE (
    currency VARCHAR(3),
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_all DECIMAL(15,2);
BEGIN
    -- Get total amount for percentage calculation
    SELECT COALESCE(SUM(amount), 0) INTO total_all
    FROM (
        SELECT amount FROM customer_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM purchase_order_payments WHERE status = 'completed'
        UNION ALL
        SELECT amount FROM payment_transactions WHERE status = 'completed'
    ) all_payments;
    
    RETURN QUERY
    SELECT 
        COALESCE(currency, 'TZS') as currency,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        CASE 
            WHEN total_all > 0 THEN (SUM(amount) * 100.0 / total_all)
            ELSE 0
        END as percentage
    FROM (
        SELECT 'TZS' as currency, amount FROM customer_payments WHERE status = 'completed'
        UNION ALL
        SELECT COALESCE(currency, 'TZS') as currency, amount FROM purchase_order_payments WHERE status = 'completed'
        UNION ALL
        SELECT COALESCE(currency, 'TZS') as currency, amount FROM payment_transactions WHERE status = 'completed'
    ) all_payments
    GROUP BY currency
    ORDER BY total_amount DESC;
END;
$$;

-- Function to get daily payment breakdown
CREATE OR REPLACE FUNCTION get_daily_payment_breakdown(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    payment_date DATE,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    currency VARCHAR(3)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        payment_date::DATE,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        'TZS' as currency
    FROM (
        SELECT 
            payment_date::DATE as payment_date,
            amount
        FROM customer_payments 
        WHERE status = 'completed' 
        AND payment_date >= NOW() - INTERVAL '1 day' * days_back
        
        UNION ALL
        
        SELECT 
            payment_date::DATE as payment_date,
            amount
        FROM purchase_order_payments 
        WHERE status = 'completed'
        AND payment_date >= NOW() - INTERVAL '1 day' * days_back
        
        UNION ALL
        
        SELECT 
            created_at::DATE as payment_date,
            amount
        FROM payment_transactions 
        WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '1 day' * days_back
    ) all_payments
    GROUP BY payment_date
    ORDER BY payment_date DESC;
END;
$$;

-- Function to get payment status analytics
CREATE OR REPLACE FUNCTION get_payment_status_analytics()
RETURNS TABLE (
    status TEXT,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_all BIGINT;
BEGIN
    -- Get total count for percentage calculation
    SELECT COUNT(*) INTO total_all
    FROM (
        SELECT status FROM customer_payments
        UNION ALL
        SELECT status FROM purchase_order_payments
        UNION ALL
        SELECT status FROM payment_transactions
    ) all_payments;
    
    RETURN QUERY
    SELECT 
        status,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        CASE 
            WHEN total_all > 0 THEN (COUNT(*) * 100.0 / total_all)
            ELSE 0
        END as percentage
    FROM (
        SELECT status, amount FROM customer_payments
        UNION ALL
        SELECT status, amount FROM purchase_order_payments
        UNION ALL
        SELECT status, amount FROM payment_transactions
    ) all_payments
    GROUP BY status
    ORDER BY transaction_count DESC;
END;
$$;

-- Function to get top customers by payments
CREATE OR REPLACE FUNCTION get_top_customers_by_payments(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    customer_id UUID,
    customer_name TEXT,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    last_payment_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.customer_id,
        COALESCE(c.name, 'Unknown Customer') as customer_name,
        COALESCE(SUM(cp.amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        MAX(cp.payment_date) as last_payment_date
    FROM customer_payments cp
    LEFT JOIN customers c ON cp.customer_id = c.id
    WHERE cp.status = 'completed'
    GROUP BY cp.customer_id, c.name
    ORDER BY total_amount DESC
    LIMIT limit_count;
END;
$$;

-- Function to get payment trends by hour
CREATE OR REPLACE FUNCTION get_payment_trends_by_hour(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    hour_of_day INTEGER,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    average_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM payment_time)::INTEGER as hour_of_day,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        COALESCE(AVG(amount), 0) as average_amount
    FROM (
        SELECT 
            payment_date as payment_time,
            amount
        FROM customer_payments 
        WHERE status = 'completed' 
        AND payment_date >= NOW() - INTERVAL '1 day' * days_back
        
        UNION ALL
        
        SELECT 
            payment_date as payment_time,
            amount
        FROM purchase_order_payments 
        WHERE status = 'completed'
        AND payment_date >= NOW() - INTERVAL '1 day' * days_back
        
        UNION ALL
        
        SELECT 
            created_at as payment_time,
            amount
        FROM payment_transactions 
        WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '1 day' * days_back
    ) all_payments
    GROUP BY EXTRACT(HOUR FROM payment_time)
    ORDER BY hour_of_day;
END;
$$;

-- Function to get failed payment analysis
CREATE OR REPLACE FUNCTION get_failed_payment_analysis()
RETURNS TABLE (
    failure_reason TEXT,
    total_amount DECIMAL(15,2),
    transaction_count BIGINT,
    percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_failed BIGINT;
BEGIN
    -- Get total failed count for percentage calculation
    SELECT COUNT(*) INTO total_failed
    FROM (
        SELECT status FROM customer_payments WHERE status = 'failed'
        UNION ALL
        SELECT status FROM purchase_order_payments WHERE status = 'failed'
        UNION ALL
        SELECT status FROM payment_transactions WHERE status = 'failed'
    ) all_failed;
    
    RETURN QUERY
    SELECT 
        'Payment Failed' as failure_reason,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        CASE 
            WHEN total_failed > 0 THEN (COUNT(*) * 100.0 / total_failed)
            ELSE 0
        END as percentage
    FROM (
        SELECT amount FROM customer_payments WHERE status = 'failed'
        UNION ALL
        SELECT amount FROM purchase_order_payments WHERE status = 'failed'
        UNION ALL
        SELECT amount FROM payment_transactions WHERE status = 'failed'
    ) all_failed;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on all RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION get_total_revenue_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_payment_trends(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_currency_usage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_payment_breakdown(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_status_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_customers_by_payments(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_trends_by_hour(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_failed_payment_analysis() TO authenticated;

-- =====================================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert some sample data into device_payments if table is empty
INSERT INTO device_payments (customer_id, device_id, amount, method, status, reference)
SELECT 
    c.id as customer_id,
    d.id as device_id,
    ROUND((RANDOM() * 500000 + 50000)::NUMERIC, 2) as amount,
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'card'
        ELSE 'transfer'
    END as method,
    'completed' as status,
    'DEV-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as reference
FROM customers c
CROSS JOIN devices d
WHERE NOT EXISTS (SELECT 1 FROM device_payments LIMIT 1)
LIMIT 5;

-- Insert some sample data into repair_payments if table is empty
INSERT INTO repair_payments (customer_id, device_id, amount, method, status, reference)
SELECT 
    c.id as customer_id,
    d.id as device_id,
    ROUND((RANDOM() * 300000 + 20000)::NUMERIC, 2) as amount,
    CASE (RANDOM() * 3)::INT
        WHEN 0 THEN 'cash'
        WHEN 1 THEN 'card'
        ELSE 'transfer'
    END as method,
    'completed' as status,
    'REP-' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as reference
FROM customers c
CROSS JOIN devices d
WHERE NOT EXISTS (SELECT 1 FROM repair_payments LIMIT 1)
LIMIT 3;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'device_payments' as table_name, COUNT(*) as record_count FROM device_payments
UNION ALL
SELECT 'repair_payments' as table_name, COUNT(*) as record_count FROM repair_payments;

-- Test RPC functions
SELECT 'get_total_revenue_summary' as function_name, COUNT(*) as result_count FROM get_total_revenue_summary()
UNION ALL
SELECT 'get_monthly_payment_trends' as function_name, COUNT(*) as result_count FROM get_monthly_payment_trends(6)
UNION ALL
SELECT 'get_payment_method_analytics' as function_name, COUNT(*) as result_count FROM get_payment_method_analytics();
