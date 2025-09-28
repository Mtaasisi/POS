-- Fixed SQL statements for missing tables
-- Remove IF NOT EXISTS from CREATE POLICY statements

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

-- Create RLS policies for returns table (without IF NOT EXISTS)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view returns" ON returns;
    DROP POLICY IF EXISTS "Users can insert returns" ON returns;
    DROP POLICY IF EXISTS "Users can update returns" ON returns;
    
    -- Create new policies
    CREATE POLICY "Users can view returns" ON returns
        FOR SELECT USING (true);

    CREATE POLICY "Users can insert returns" ON returns
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update returns" ON returns
        FOR UPDATE USING (true);
END $$;

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

-- Create RLS policies for customer_preferences table (without IF NOT EXISTS)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view customer preferences" ON customer_preferences;
    DROP POLICY IF EXISTS "Users can insert customer preferences" ON customer_preferences;
    DROP POLICY IF EXISTS "Users can update customer preferences" ON customer_preferences;
    
    -- Create new policies
    CREATE POLICY "Users can view customer preferences" ON customer_preferences
        FOR SELECT USING (true);

    CREATE POLICY "Users can insert customer preferences" ON customer_preferences
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update customer preferences" ON customer_preferences
        FOR UPDATE USING (true);
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON returns TO authenticated;
GRANT ALL ON customer_preferences TO authenticated;

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
END $$;
