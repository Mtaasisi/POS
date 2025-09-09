import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerPaymentsTable() {
  console.log('🔍 Checking customer_payments table...\n');

  try {
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Table access error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Table exists and is accessible');
      console.log('📊 Sample data:', data);
      console.log('📈 Total records:', data?.length || 0);
    }

    // Try to get table schema info
    console.log('\n🔍 Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'customer_payments' });

    if (schemaError) {
      console.log('⚠️ Could not get schema info (function may not exist)');
    } else {
      console.log('📋 Table schema:', schemaData);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkCustomerPaymentsTable();
