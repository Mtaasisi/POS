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
    console.log('🔧 Creating customer_payments table using REST API...');
    
    // Try to create the table using the REST API directly
    const createTableSQL = `
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
    
    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating table:', errorText);
      
      // Try using the SQL editor endpoint
      console.log('🔄 Trying SQL editor endpoint...');
      
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: createTableSQL
        })
      });
      
      if (!sqlResponse.ok) {
        const sqlErrorText = await sqlResponse.text();
        console.error('❌ Error with SQL endpoint:', sqlErrorText);
        
        // Try a different approach - create table through the Supabase client
        console.log('🔄 Trying direct table creation...');
        
        // First, let's check if we can access the database directly
        const { data: testData, error: testError } = await supabase
          .from('customers')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('❌ Cannot access database:', testError);
          return;
        }
        
        console.log('✅ Database is accessible');
        
        // Since we can't create tables directly, let's check what's available
        console.log('🔍 Checking available tables...');
        
        // Try to access the customer_payments table
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('customer_payments')
          .select('*')
          .limit(1);
        
        if (paymentsError) {
          console.error('❌ customer_payments table does not exist:', paymentsError.message);
          
          // Let's try to create a simple test record to see if we can create the table
          console.log('🔄 Attempting to create test record...');
          
          const { data: insertData, error: insertError } = await supabase
            .from('customer_payments')
            .insert({
              customer_id: testData[0]?.id || '00000000-0000-0000-0000-000000000000',
              amount: 100.00,
              method: 'cash',
              payment_type: 'payment',
              status: 'completed'
            })
            .select();
          
          if (insertError) {
            console.error('❌ Cannot insert into customer_payments:', insertError);
          } else {
            console.log('✅ Successfully inserted test record:', insertData);
          }
        } else {
          console.log('✅ customer_payments table exists and is accessible');
        }
        
      } else {
        console.log('✅ Table created using SQL endpoint');
      }
    } else {
      console.log('✅ Table created successfully');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createCustomerPaymentsTable();
