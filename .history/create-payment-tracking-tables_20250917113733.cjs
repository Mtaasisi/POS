// Create payment tracking tables and functions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔄 Creating payment tracking tables...');
  
  // Create device_payments table
  const createDevicePayments = `
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
  `;
  
  // Create repair_payments table
  const createRepairPayments = `
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
  `;
  
  // Create indexes
  const createIndexes = `
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
  `;
  
  // Enable RLS and create policies
  const enableRLS = `
    ALTER TABLE device_payments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE repair_payments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all access for authenticated users" ON device_payments
      FOR ALL USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable all access for authenticated users" ON repair_payments
      FOR ALL USING (auth.role() = 'authenticated');
    
    GRANT ALL ON device_payments TO authenticated;
    GRANT ALL ON repair_payments TO authenticated;
  `;
  
  // Create triggers
  const createTriggers = `
    CREATE TRIGGER update_device_payments_updated_at 
      BEFORE UPDATE ON device_payments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_repair_payments_updated_at 
      BEFORE UPDATE ON repair_payments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;
  
  try {
    // Execute table creation
    console.log('Creating device_payments table...');
    const { error: deviceError } = await supabase.rpc('exec', { sql: createDevicePayments });
    if (deviceError) console.log('Device payments error:', deviceError.message);
    
    console.log('Creating repair_payments table...');
    const { error: repairError } = await supabase.rpc('exec', { sql: createRepairPayments });
    if (repairError) console.log('Repair payments error:', repairError.message);
    
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexes });
    if (indexError) console.log('Index error:', indexError.message);
    
    console.log('Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec', { sql: enableRLS });
    if (rlsError) console.log('RLS error:', rlsError.message);
    
    console.log('Creating triggers...');
    const { error: triggerError } = await supabase.rpc('exec', { sql: createTriggers });
    if (triggerError) console.log('Trigger error:', triggerError.message);
    
    console.log('✅ Tables created successfully');
    
  } catch (error) {
    console.log('❌ Error creating tables:', error.message);
  }
}

async function testTables() {
  console.log('\n🧪 Testing table access...');
  
  try {
    const { data: devicePayments, error: deviceError } = await supabase
      .from('device_payments')
      .select('*')
      .limit(1);
    
    if (deviceError) {
      console.log('❌ device_payments access failed:', deviceError.message);
    } else {
      console.log('✅ device_payments accessible:', devicePayments.length, 'records');
    }
    
    const { data: repairPayments, error: repairError } = await supabase
      .from('repair_payments')
      .select('*')
      .limit(1);
    
    if (repairError) {
      console.log('❌ repair_payments access failed:', repairError.message);
    } else {
      console.log('✅ repair_payments accessible:', repairPayments.length, 'records');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

async function main() {
  await createTables();
  await testTables();
}

main().catch(console.error);
