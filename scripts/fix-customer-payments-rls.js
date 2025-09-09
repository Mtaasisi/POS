import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCustomerPaymentsRLS() {
  console.log('🔧 Fixing customer_payments RLS policies...\n');

  try {
    // First, let's try to insert with a service role key if available
    // For now, let's check if we can at least read the table structure
    
    console.log('📋 Current table structure:');
    const { data: structure, error: structureError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error reading table structure:', structureError);
    } else {
      console.log('✅ Table structure accessible');
      console.log('📊 Sample record structure:', structure);
    }

    console.log('\n💡 The RLS policy is preventing inserts.');
    console.log('   You need to run this SQL in your Supabase dashboard:');
    console.log('\n   -- Fix customer_payments RLS policy');
    console.log('   DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;');
    console.log('   CREATE POLICY "Enable all access for authenticated users" ON customer_payments');
    console.log('       FOR ALL USING (auth.role() = \'authenticated\');');
    console.log('\n   Or run the migration file: 20250131000014_create_customer_payments_table.sql');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
fixCustomerPaymentsRLS();
