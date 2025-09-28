import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
    
    // First, let's try to create the table using a simple approach
    // We'll use the Supabase client to execute raw SQL
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS customer_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
          amount NUMERIC(12,2) NOT NULL,
          method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer')),
          payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'deposit', 'refund')),
          status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'approved')),
          payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          currency VARCHAR(3) DEFAULT 'TZS',
          payment_account_id UUID REFERENCES finance_accounts(id),
          payment_method_id UUID,
          reference VARCHAR(255),
          notes TEXT
      );
    `;
    
    // Try to execute the SQL using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTableQuery
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating table:', errorText);
      
      // Try alternative approach - create table without foreign keys first
      console.log('🔄 Trying alternative approach...');
      
      const simpleCreateQuery = `
        CREATE TABLE IF NOT EXISTS customer_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID NOT NULL,
            device_id UUID,
            amount NUMERIC(12,2) NOT NULL,
            method TEXT NOT NULL DEFAULT 'cash',
            payment_type TEXT NOT NULL DEFAULT 'payment',
            status TEXT NOT NULL DEFAULT 'completed',
            payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by UUID,
            currency VARCHAR(3) DEFAULT 'TZS',
            payment_account_id UUID,
            payment_method_id UUID,
            reference VARCHAR(255),
            notes TEXT
        );
      `;
      
      const simpleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: simpleCreateQuery
        })
      });
      
      if (!simpleResponse.ok) {
        const simpleErrorText = await simpleResponse.text();
        console.error('❌ Error creating simple table:', simpleErrorText);
        return;
      }
      
      console.log('✅ Simple table created, now adding constraints...');
      
      // Add constraints separately
      const constraints = [
        "ALTER TABLE customer_payments ADD CONSTRAINT check_method CHECK (method IN ('cash', 'card', 'transfer'));",
        "ALTER TABLE customer_payments ADD CONSTRAINT check_payment_type CHECK (payment_type IN ('payment', 'deposit', 'refund'));",
        "ALTER TABLE customer_payments ADD CONSTRAINT check_status CHECK (status IN ('completed', 'pending', 'failed', 'approved'));",
        "ALTER TABLE customer_payments ADD CONSTRAINT fk_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;",
        "ALTER TABLE customer_payments ADD CONSTRAINT fk_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;",
        "ALTER TABLE customer_payments ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;",
        "ALTER TABLE customer_payments ADD CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;",
        "ALTER TABLE customer_payments ADD CONSTRAINT fk_payment_account_id FOREIGN KEY (payment_account_id) REFERENCES finance_accounts(id);"
      ];
      
      for (const constraint of constraints) {
        try {
          const constraintResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
              sql: constraint
            })
          });
          
          if (!constraintResponse.ok) {
            const constraintError = await constraintResponse.text();
            console.log(`⚠️  Constraint warning: ${constraintError}`);
          } else {
            console.log('✅ Constraint added successfully');
          }
        } catch (err) {
          console.log(`⚠️  Constraint error: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Table created successfully');
    }
    
    // Test the table
    console.log('🧪 Testing table access...');
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error testing table:', error);
    } else {
      console.log('✅ Table is accessible');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createCustomerPaymentsTable();
