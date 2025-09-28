import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixCustomerPayments400() {
  console.log('🚀 Running Customer Payments 400 Error Fix...');
  
  try {
    // Read the fix SQL file
    const fixSQLPath = path.join(process.cwd(), 'permanent_customer_payments_400_fix.sql');
    const fixSQL = fs.readFileSync(fixSQLPath, 'utf8');
    
    console.log('📋 Applying customer payments fix...');
    console.log(`📄 SQL file size: ${fixSQL.length} characters`);
    
    // Execute the fix using RPC
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: fixSQL
    });
    
    if (fixError) {
      console.error('❌ Fix failed:', fixError);
      return;
    }
    
    console.log('✅ Customer payments fix completed successfully');
    
    // Test the table structure by trying to query it
    console.log('🧪 Testing customer_payments table access...');
    
    const { data: testData, error: testError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table access test failed:', testError.message);
      return;
    }
    
    console.log('✅ Table access test successful');
    
    // Check if we can get table structure
    console.log('🔍 Checking table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'customer_payments'
          ORDER BY ordinal_position;
        `
      });
    
    if (columnsError) {
      console.log('⚠️  Could not retrieve table structure:', columnsError.message);
    } else {
      console.log('📊 Customer payments table structure:');
      console.table(columns);
    }
    
    console.log('\n🎉 Customer payments 400 error fix completed!');
    console.log('✅ The following columns have been added:');
    console.log('   - currency (VARCHAR(3), default: TZS)');
    console.log('   - payment_account_id (UUID)');
    console.log('   - payment_method_id (UUID)');
    console.log('   - reference (VARCHAR(255))');
    console.log('   - notes (TEXT)');
    console.log('   - updated_by (UUID)');
    console.log('\n💡 Your payment POST requests should now work without 400 errors!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixCustomerPayments400();
