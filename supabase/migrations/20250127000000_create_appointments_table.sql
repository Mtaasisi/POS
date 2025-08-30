-- Create appointments table for customer scheduling
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  notes TEXT,
  duration_minutes INTEGER DEFAULT 60,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);

-- Create customer revenue tracking table
CREATE TABLE IF NOT EXISTS customer_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  revenue_type VARCHAR(50) NOT NULL CHECK (revenue_type IN ('device_repair', 'pos_sale', 'service_fee', 'consultation')),
  amount DECIMAL(10,2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id VARCHAR(100),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customer revenue
CREATE INDEX IF NOT EXISTS idx_customer_revenue_customer_id ON customer_revenue(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_type ON customer_revenue(revenue_type);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_date ON customer_revenue(transaction_date);

-- Add RLS policies for appointments (with IF NOT EXISTS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can view appointments') THEN
        CREATE POLICY "Users can view appointments" ON appointments FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can insert appointments') THEN
        CREATE POLICY "Users can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can update appointments') THEN
        CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can delete appointments') THEN
        CREATE POLICY "Users can delete appointments" ON appointments FOR DELETE USING (true);
    END IF;
END $$;

-- Add RLS policies for customer revenue (with IF NOT EXISTS)
ALTER TABLE customer_revenue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can view customer revenue') THEN
        CREATE POLICY "Users can view customer revenue" ON customer_revenue FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can insert customer revenue') THEN
        CREATE POLICY "Users can insert customer revenue" ON customer_revenue FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can update customer revenue') THEN
        CREATE POLICY "Users can update customer revenue" ON customer_revenue FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_revenue' AND policyname = 'Users can delete customer revenue') THEN
        CREATE POLICY "Users can delete customer revenue" ON customer_revenue FOR DELETE USING (true);
    END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample appointments for testing (only if table is empty)
INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, status, notes, priority)
SELECT 
  c.id,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Device Repair'
    WHEN 1 THEN 'Device Diagnosis'
    WHEN 2 THEN 'Software Installation'
    ELSE 'Hardware Upgrade'
  END,
  CURRENT_DATE + (random() * 30)::int * INTERVAL '1 day',
  '10:00:00'::time + (random() * 8)::int * INTERVAL '1 hour',
  CASE (random() * 3)::int
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'confirmed'
    WHEN 2 THEN 'completed'
    ELSE 'cancelled'
  END,
  'Sample appointment for testing',
  CASE (random() * 2)::int
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    ELSE 'high'
  END
FROM customers c
WHERE c.is_active = true
  AND NOT EXISTS (SELECT 1 FROM appointments LIMIT 1)
LIMIT 10;

-- Insert sample customer revenue data (only if table is empty)
INSERT INTO customer_revenue (customer_id, revenue_type, amount, description)
SELECT 
  c.id,
  CASE (random() * 1)::int
    WHEN 0 THEN 'device_repair'
    ELSE 'pos_sale'
  END,
  (random() * 1000 + 50)::decimal(10,2),
  'Sample revenue transaction'
FROM customers c
WHERE c.is_active = true
  AND NOT EXISTS (SELECT 1 FROM customer_revenue LIMIT 1)
LIMIT 20;
