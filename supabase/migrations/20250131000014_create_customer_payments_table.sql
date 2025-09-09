-- Create customer_payments table for device repair payments
-- Migration: 20250131000014_create_customer_payments_table.sql

-- Create customer_payments table
CREATE TABLE IF NOT EXISTS customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer')),
    payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'deposit', 'refund')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_device_id ON customer_payments(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON customer_payments(status);
CREATE INDEX IF NOT EXISTS idx_customer_payments_method ON customer_payments(method);

-- Enable Row Level Security
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON customer_payments TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'customer_payments' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Customer payments table created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create customer payments table';
  END IF;
END $$;
