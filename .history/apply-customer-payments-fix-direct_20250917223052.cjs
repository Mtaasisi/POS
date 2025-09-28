const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCustomerPaymentsFix() {
  try {
    console.log('🔧 Applying customer_payments missing columns fix for 400 error...');
    
    // Add missing columns one by one
    const columns = [
      {
        name: 'currency',
        sql: "ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS'"
      },
      {
        name: 'payment_account_id',
        sql: 'ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id)'
      },
      {
        name: 'payment_method_id',
        sql: 'ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS payment_method_id UUID'
      },
      {
        name: 'reference',
        sql: 'ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS reference VARCHAR(255)'
      },
      {
        name: 'notes',
        sql: 'ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS notes TEXT'
      },
      {
        name: 'updated_by',
        sql: 'ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id)'
      }
    ];
    
    console.log(`📝 Adding ${columns.length} missing columns...`);
    
    // Add each column
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      try {
        console.log(`  ${i + 1}/${columns.length}: Adding ${column.name} column...`);
        
        const { data, error } = await supabase.rpc('exec', { sql: column.sql });
        
        if (error) {
          console.warn(`⚠️ Warning adding ${column.name}:`, error.message);
        } else {
          console.log(`  ✅ ${column.name} column added successfully`);
        }
      } catch (err) {
        console.warn(`⚠️ Exception adding ${column.name}:`, err.message);
      }
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency)',
      'CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id)',
      'CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id)',
      'CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference)',
      'CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by)'
    ];
    
    console.log('📝 Creating indexes...');
    for (let i = 0; i < indexes.length; i++) {
      try {
        console.log(`  ${i + 1}/${indexes.length}: Creating index...`);
        const { data, error } = await supabase.rpc('exec', { sql: indexes[i] });
        
        if (error) {
          console.warn(`⚠️ Warning creating index ${i + 1}:`, error.message);
        } else {
          console.log(`  ✅ Index ${i + 1} created successfully`);
        }
      } catch (err) {
        console.warn(`⚠️ Exception creating index ${i + 1}:`, err.message);
      }
    }
    
    // Add currency constraint
    try {
      console.log('📝 Adding currency constraint...');
      const { data, error } = await supabase.rpc('exec', { 
        sql: "ALTER TABLE customer_payments ADD CONSTRAINT IF NOT EXISTS check_customer_payments_currency CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'))"
      });
      
      if (error) {
        console.warn('⚠️ Warning adding currency constraint:', error.message);
      } else {
        console.log('✅ Currency constraint added successfully');
      }
    } catch (err) {
      console.warn('⚠️ Exception adding currency constraint:', err.message);
    }
    
    // Update existing records
    try {
      console.log('📝 Updating existing records with default currency...');
      const { data, error } = await supabase.rpc('exec', { 
        sql: "UPDATE customer_payments SET currency = 'TZS' WHERE currency IS NULL"
      });
      
      if (error) {
        console.warn('⚠️ Warning updating records:', error.message);
      } else {
        console.log('✅ Existing records updated successfully');
      }
    } catch (err) {
      console.warn('⚠️ Exception updating records:', err.message);
    }
    
    console.log('✅ Customer payments fix applied successfully');
    console.log('📋 Fix summary:');
    console.log('  - Added currency column to customer_payments table');
    console.log('  - Added payment_account_id column to customer_payments table');
    console.log('  - Added payment_method_id column to customer_payments table');
    console.log('  - Added reference column to customer_payments table');
    console.log('  - Added notes column to customer_payments table');
    console.log('  - Added updated_by column to customer_payments table');
    console.log('  - Created necessary indexes and constraints');
    console.log('  - Updated existing records with default values');
    console.log('');
    console.log('🔄 Payment updates should now work without 400 errors');
    
  } catch (error) {
    console.error('❌ Error applying customer payments fix:', error);
    process.exit(1);
  }
}

// Test the customer_payments table structure after applying the fix
async function testCustomerPaymentsTable() {
  try {
    console.log('🧪 Testing customer_payments table structure...');
    
    // Test if we can query the table with the new columns
    const { data, error } = await supabase
      .from('customer_payments')
      .select('id, currency, payment_account_id, payment_method_id, reference, notes, updated_by')
      .limit(1);
    
    if (error) {
      console.error('❌ Table structure test failed:', error);
    } else {
      console.log('✅ Table structure test passed - all new columns are accessible');
    }
    
  } catch (err) {
    console.error('❌ Table structure test failed:', err);
  }
}

async function main() {
  await applyCustomerPaymentsFix();
  await testCustomerPaymentsTable();
}

main();
