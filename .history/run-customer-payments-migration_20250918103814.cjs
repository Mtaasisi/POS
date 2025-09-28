#!/usr/bin/env node

/**
 * Run customer_payments table migration directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomerPaymentsTable() {
  try {
    console.log('🔧 Creating customer_payments table...');
    
    // Test if table exists first
    const { data: testData, error: testError } = await supabase
      .from('customer_payments')
      .select('id')
      .limit(1);
    
    if (!testError) {
      console.log('✅ customer_payments table already exists');
      return;
    }
    
    console.log('📋 Table does not exist, you need to run the SQL migration manually.');
    console.log('📋 Please copy and run the following SQL in your Supabase dashboard:');
    console.log('');
    console.log('-- Create customer_payments table');
    console.log('CREATE TABLE IF NOT EXISTS customer_payments (');
    console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,');
    console.log('    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,');
    console.log('    amount NUMERIC(12,2) NOT NULL,');
    console.log('    method TEXT NOT NULL DEFAULT \'cash\' CHECK (method IN (\'cash\', \'card\', \'transfer\')),');
    console.log('    payment_type TEXT NOT NULL DEFAULT \'payment\' CHECK (payment_type IN (\'payment\', \'deposit\', \'refund\')),');
    console.log('    status TEXT NOT NULL DEFAULT \'completed\' CHECK (status IN (\'completed\', \'pending\', \'failed\')),');
    console.log('    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    currency VARCHAR(3) DEFAULT \'TZS\',');
    console.log('    payment_account_id UUID REFERENCES finance_accounts(id),');
    console.log('    payment_method_id UUID,');
    console.log('    reference VARCHAR(255),');
    console.log('    notes TEXT,');
    console.log('    updated_by UUID REFERENCES auth.users(id)');
    console.log(');');
    console.log('');
    console.log('-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_device_id ON customer_payments(device_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON customer_payments(status);');
    console.log('CREATE INDEX IF NOT EXISTS idx_customer_payments_method ON customer_payments(method);');
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create policy');
    console.log('CREATE POLICY "Enable all access for authenticated users" ON customer_payments');
    console.log('    FOR ALL USING (auth.role() = \'authenticated\') WITH CHECK (auth.role() = \'authenticated\');');
    console.log('');
    console.log('-- Grant permissions');
    console.log('GRANT ALL ON customer_payments TO authenticated;');
    console.log('GRANT ALL ON customer_payments TO service_role;');
    console.log('');
    console.log('🎯 After running the SQL, refresh your app and the 400 errors should be resolved!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCustomerPaymentsTable();
