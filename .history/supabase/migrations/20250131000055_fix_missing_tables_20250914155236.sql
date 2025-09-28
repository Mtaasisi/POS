-- Fix Missing Tables Migration
-- This migration creates the missing tables that are causing 404 errors

-- =====================================================
-- CREATE RETURNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  return_type VARCHAR(50) NOT NULL CHECK (return_type IN ('repair', 'warranty', 'exchange', 'refund')),
  return_reason TEXT,
  return_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  refund_amount DECIMAL(10,2),
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for returns table
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_device_id ON returns(device_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);

-- Enable RLS for returns table
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for returns table
CREATE POLICY IF NOT EXISTS "Users can view returns" ON returns
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert returns" ON returns
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update returns" ON returns
  FOR UPDATE USING (true);

-- =====================================================
-- CREATE CUSTOMER_PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_contact_method IN ('whatsapp', 'sms', 'phone', 'email')),
  notification_preferences JSONB DEFAULT '{"repair_updates": true, "appointment_reminders": true, "promotions": false}',
  language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'sw')),
  timezone VARCHAR(50) DEFAULT 'Africa/Dar_es_Salaam',
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Create indexes for customer_preferences table
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);

-- Enable RLS for customer_preferences table
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_preferences table
CREATE POLICY IF NOT EXISTS "Users can view customer preferences" ON customer_preferences
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert customer preferences" ON customer_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update customer preferences" ON customer_preferences
  FOR UPDATE USING (true);

-- =====================================================
-- ENSURE APPOINTMENTS TABLE EXISTS (if not already created)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  technician_id UUID,
  notes TEXT,
  duration_minutes INTEGER DEFAULT 60,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for appointments table (if not exist)
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);

-- Enable RLS for appointments table (if not already enabled)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments table (if not exist)
CREATE POLICY IF NOT EXISTS "Users can view appointments" ON appointments
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update appointments" ON appointments
  FOR UPDATE USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON returns TO authenticated;
GRANT ALL ON customer_preferences TO authenticated;
GRANT ALL ON appointments TO authenticated;

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================
DO $$
BEGIN
  -- Check if returns table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'returns') THEN
    RAISE NOTICE '✅ Returns table created successfully';
  ELSE
    RAISE NOTICE '❌ Returns table creation failed';
  END IF;

  -- Check if customer_preferences table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_preferences') THEN
    RAISE NOTICE '✅ Customer preferences table created successfully';
  ELSE
    RAISE NOTICE '❌ Customer preferences table creation failed';
  END IF;

  -- Check if appointments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    RAISE NOTICE '✅ Appointments table created successfully';
  ELSE
    RAISE NOTICE '❌ Appointments table creation failed';
  END IF;
END $$;
