#!/usr/bin/env node

/**
 * Create customer_payments table using direct SQL execution
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
    
    // First, let's check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('customer_payments')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ customer_payments table already exists');
      return;
    }
    
    console.log('📋 Table does not exist, creating...');
    
    // Since we can't use exec_sql, let's try to create a simple test record
    // This will fail if the table doesn't exist, but we can use the error to understand the structure
    const { data: testData, error: testError } = await supabase
      .from('customer_payments')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000',
        amount: 0.01,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed'
      })
      .select();
    
    if (testError) {
      console.log('❌ Table creation needed. Error:', testError.message);
      console.log('📋 Please run the following SQL in your Supabase dashboard:');
      console.log(`
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    currency VARCHAR(3) DEFAULT 'TZS',
    payment_account_id UUID REFERENCES finance_accounts(id),
    payment_method_id UUID,
    reference VARCHAR(255),
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_device_id ON customer_payments(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON customer_payments(status);
CREATE INDEX IF NOT EXISTS idx_customer_payments_method ON customer_payments(method);

-- Enable RLS
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON customer_payments TO authenticated;
GRANT ALL ON customer_payments TO service_role;
      `);
    } else {
      console.log('✅ Table exists and test insert successful');
      // Clean up test record
      await supabase
        .from('customer_payments')
        .delete()
        .eq('id', testData[0].id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCustomerPaymentsTable();
