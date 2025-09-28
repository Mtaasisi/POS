#!/usr/bin/env node

/**
 * Create customer_payments table directly
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
    
    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      return;
    }
    
    console.log('✅ Table created successfully');
    
    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_payments_device_id ON customer_payments(device_id);
        CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);
        CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON customer_payments(status);
        CREATE INDEX IF NOT EXISTS idx_customer_payments_method ON customer_payments(method);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all access for authenticated users" ON customer_payments
            FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
      `
    });
    
    if (rlsError) {
      console.error('❌ Error setting up RLS:', rlsError);
    } else {
      console.log('✅ RLS policies created successfully');
    }
    
    // Grant permissions
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT ALL ON customer_payments TO authenticated;
        GRANT ALL ON customer_payments TO service_role;
      `
    });
    
    if (grantError) {
      console.error('❌ Error granting permissions:', grantError);
    } else {
      console.log('✅ Permissions granted successfully');
    }
    
    // Test the table
    console.log('🧪 Testing table...');
    const { data, error: testError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Table test successful');
    }
    
    console.log('🎉 customer_payments table created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCustomerPaymentsTable();
