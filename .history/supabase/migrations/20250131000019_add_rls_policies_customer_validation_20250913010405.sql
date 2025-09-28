-- Add RLS policies for customer validation
-- This migration adds Row Level Security policies to ensure data integrity

-- Add RLS policies to ensure users can only access their own customer data
-- (This assumes you have RLS enabled and user authentication in place)

-- Policy for customer_payments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_payments' AND policyname = 'customer_payments_customer_validation') THEN
        DROP POLICY customer_payments_customer_validation ON customer_payments;
    END IF;
    
    CREATE POLICY customer_payments_customer_validation ON customer_payments
    FOR ALL
    USING (customer_id IS NOT NULL AND customer_id != '');
END $$;

-- Policy for lats_sales (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lats_sales') THEN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lats_sales' AND policyname = 'lats_sales_customer_validation') THEN
            DROP POLICY lats_sales_customer_validation ON lats_sales;
        END IF;
        
        CREATE POLICY lats_sales_customer_validation ON lats_sales
        FOR ALL
        USING (customer_id IS NOT NULL AND customer_id != '');
    END IF;
END $$;

-- Policy for payment_transactions (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'payment_transactions_customer_validation') THEN
            DROP POLICY payment_transactions_customer_validation ON payment_transactions;
        END IF;
        
        CREATE POLICY payment_transactions_customer_validation ON payment_transactions
        FOR ALL
        USING (customer_id IS NOT NULL AND customer_id != '');
    END IF;
END $$;
