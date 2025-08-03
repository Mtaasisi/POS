-- Fix payment tables - run this in your Supabase SQL editor
-- This script handles common issues with payment method tables

-- 1. Check if old table name exists and rename it if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods_accounts') THEN
        ALTER TABLE payment_methods_accounts RENAME TO payment_method_accounts;
        RAISE NOTICE 'Renamed payment_methods_accounts to payment_method_accounts';
    ELSE
        RAISE NOTICE 'payment_methods_accounts table does not exist (correct)';
    END IF;
END $$;

-- 2. Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'card', 'transfer', 'mobile_money', 'check', 'installment', 'delivery')),
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create payment_method_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_method_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE CASCADE,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_method_id, account_id)
);

-- 4. Insert default payment methods if they don't exist
INSERT INTO payment_methods (name, code, type, icon, color, description) VALUES
-- Cash Methods
('Cash', 'cash', 'cash', 'dollar-sign', '#10B981', 'Physical cash payments'),
('Cash on Delivery', 'cash_on_delivery', 'cash', 'truck', '#F59E0B', 'Cash payment upon delivery'),

-- Card Methods
('Credit Card', 'credit_card', 'card', 'credit-card', '#3B82F6', 'Credit card payments'),
('Debit Card', 'debit_card', 'card', 'credit-card', '#8B5CF6', 'Debit card payments'),
('Card Payment', 'card', 'card', 'credit-card', '#6366F1', 'Generic card payment'),

-- Transfer Methods
('Bank Transfer', 'bank_transfer', 'transfer', 'building', '#059669', 'Direct bank transfers'),
('Mobile Money', 'mobile_money', 'mobile_money', 'smartphone', '#DC2626', 'Mobile money payments'),
('Wire Transfer', 'wire_transfer', 'transfer', 'globe', '#7C3AED', 'International wire transfers'),

-- Check Methods
('Check', 'check', 'check', 'file-text', '#F97316', 'Check payments'),
('Postdated Check', 'postdated_check', 'check', 'calendar', '#EF4444', 'Postdated check payments'),

-- Installment Methods
('Installment Payment', 'installment', 'installment', 'calendar', '#8B5CF6', 'Payment in installments'),
('Monthly Installment', 'monthly_installment', 'installment', 'calendar', '#EC4899', 'Monthly installment payments'),

-- Delivery Methods
('Payment on Delivery', 'payment_on_delivery', 'delivery', 'truck', '#F59E0B', 'Payment upon delivery'),
('Pickup Payment', 'pickup_payment', 'delivery', 'package', '#10B981', 'Payment upon pickup')
ON CONFLICT (code) DO NOTHING;

-- 5. Add payment_method_id columns to existing tables if they don't exist
DO $$
BEGIN
    -- Add to sales_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'payment_method_id') THEN
        ALTER TABLE sales_orders ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
        RAISE NOTICE 'Added payment_method_id to sales_orders';
    END IF;
    
    -- Add to finance_expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_expenses' AND column_name = 'payment_method_id') THEN
        ALTER TABLE finance_expenses ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
        RAISE NOTICE 'Added payment_method_id to finance_expenses';
    END IF;
    
    -- Add to installment_payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installment_payments' AND column_name = 'payment_method_id') THEN
        ALTER TABLE installment_payments ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
        RAISE NOTICE 'Added payment_method_id to installment_payments';
    END IF;
END $$;

-- 6. Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_accounts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
CREATE POLICY "Users can view payment methods" ON payment_methods 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view payment method accounts" ON payment_method_accounts;
CREATE POLICY "Users can view payment method accounts" ON payment_method_accounts 
FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_method_accounts_method_id ON payment_method_accounts(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_accounts_account_id ON payment_method_accounts(account_id);

-- 9. Create trigger for updated_at if function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_payment_methods_updated_at 
        BEFORE UPDATE ON payment_methods 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for payment_methods';
    END IF;
END $$;

-- 10. Show final status
SELECT 'FIX COMPLETED' as status;
SELECT 'payment_methods' as table_name, COUNT(*) as record_count FROM payment_methods;
SELECT 'payment_method_accounts' as table_name, COUNT(*) as record_count FROM payment_method_accounts; 