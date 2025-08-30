-- Clean migration for appointments table only
-- This avoids conflicts with existing tables and policies

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

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
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

-- Add trigger to update updated_at timestamp (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at 
          BEFORE UPDATE ON appointments 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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
LIMIT 5;
