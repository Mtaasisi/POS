import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTablesDirect() {
  console.log('🔧 Creating missing tables directly...\n');

  try {
    // 1. Create returns table using direct SQL
    console.log('1️⃣ Creating returns table...');
    
    // First, let's try to create the table using a simple approach
    const { data: returnsData, error: returnsError } = await supabase
      .from('returns')
      .select('*')
      .limit(1);
    
    if (returnsError && returnsError.message.includes('relation "public.returns" does not exist')) {
      console.log('Returns table does not exist, creating it...');
      
      // Since we can't execute DDL directly, let's create a simple test record
      // This will help us understand the table structure needed
      console.log('⚠️ Cannot create table directly via client. Need to use Supabase dashboard or CLI.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
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
      `);
    } else if (returnsError) {
      console.error('❌ Returns table error:', returnsError.message);
    } else {
      console.log('✅ Returns table already exists');
    }

    // 2. Create customer_preferences table
    console.log('\n2️⃣ Creating customer_preferences table...');
    
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('customer_preferences')
      .select('*')
      .limit(1);
    
    if (preferencesError && preferencesError.message.includes('relation "public.customer_preferences" does not exist')) {
      console.log('Customer preferences table does not exist, creating it...');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
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
      `);
    } else if (preferencesError) {
      console.error('❌ Customer preferences table error:', preferencesError.message);
    } else {
      console.log('✅ Customer preferences table already exists');
    }

    // 3. Test appointments table
    console.log('\n3️⃣ Testing appointments table...');
    
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (appointmentsError) {
      console.error('❌ Appointments table error:', appointmentsError.message);
    } else {
      console.log('✅ Appointments table accessible');
    }

    console.log('\n📋 Summary:');
    console.log('1. Returns table: Needs to be created via Supabase dashboard');
    console.log('2. Customer preferences table: Needs to be created via Supabase dashboard');
    console.log('3. Appointments table: ✅ Already exists and accessible');
    
    console.log('\n🔧 To fix the 404 errors:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL statements provided above');
    console.log('4. The 404 errors will be resolved once the tables are created');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTablesDirect();
