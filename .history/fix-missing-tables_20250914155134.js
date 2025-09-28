const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMissingTables() {
  console.log('🔧 Fixing missing database tables...\n');

  try {
    // 1. Create returns table
    console.log('1️⃣ Creating returns table...');
    const { error: returnsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
        CREATE INDEX IF NOT EXISTS idx_returns_device_id ON returns(device_id);
        CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
        CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);
        
        ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view returns" ON returns
          FOR SELECT USING (true);
        
        CREATE POLICY IF NOT EXISTS "Users can insert returns" ON returns
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY IF NOT EXISTS "Users can update returns" ON returns
          FOR UPDATE USING (true);
      `
    });

    if (returnsError) {
      console.error('❌ Error creating returns table:', returnsError.message);
    } else {
      console.log('✅ Returns table created successfully');
    }

    // 2. Create customer_preferences table
    console.log('\n2️⃣ Creating customer_preferences table...');
    const { error: preferencesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);
        
        ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view customer preferences" ON customer_preferences
          FOR SELECT USING (true);
        
        CREATE POLICY IF NOT EXISTS "Users can insert customer preferences" ON customer_preferences
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY IF NOT EXISTS "Users can update customer preferences" ON customer_preferences
          FOR UPDATE USING (true);
      `
    });

    if (preferencesError) {
      console.error('❌ Error creating customer_preferences table:', preferencesError.message);
    } else {
      console.log('✅ Customer preferences table created successfully');
    }

    // 3. Create appointments table (if not exists)
    console.log('\n3️⃣ Creating appointments table...');
    const { error: appointmentsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);
        
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view appointments" ON appointments
          FOR SELECT USING (true);
        
        CREATE POLICY IF NOT EXISTS "Users can insert appointments" ON appointments
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY IF NOT EXISTS "Users can update appointments" ON appointments
          FOR UPDATE USING (true);
      `
    });

    if (appointmentsError) {
      console.error('❌ Error creating appointments table:', appointmentsError.message);
    } else {
      console.log('✅ Appointments table created successfully');
    }

    // 4. Test the tables
    console.log('\n4️⃣ Testing table access...');
    
    const { data: returnsTest, error: returnsTestError } = await supabase
      .from('returns')
      .select('*')
      .limit(1);
    
    if (returnsTestError) {
      console.error('❌ Returns table test failed:', returnsTestError.message);
    } else {
      console.log('✅ Returns table accessible');
    }

    const { data: preferencesTest, error: preferencesTestError } = await supabase
      .from('customer_preferences')
      .select('*')
      .limit(1);
    
    if (preferencesTestError) {
      console.error('❌ Customer preferences table test failed:', preferencesTestError.message);
    } else {
      console.log('✅ Customer preferences table accessible');
    }

    const { data: appointmentsTest, error: appointmentsTestError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (appointmentsTestError) {
      console.error('❌ Appointments table test failed:', appointmentsTestError.message);
    } else {
      console.log('✅ Appointments table accessible');
    }

    console.log('\n🎉 Database table fixes completed!');
    console.log('The 404 errors should now be resolved.');

  } catch (error) {
    console.error('❌ Error fixing tables:', error);
  }
}

fixMissingTables();
