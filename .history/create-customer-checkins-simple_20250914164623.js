import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCustomerCheckinsTable() {
  try {
    console.log('🚀 Creating customer_checkins table...');
    
    // First, let's try to create the table using a simple approach
    // We'll use the SQL editor approach by creating a simple migration
    
    // Test if we can query the customers table first
    console.log('🔍 Testing database connection...');
    const { data: customers, error: testError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Since we can't execute raw SQL directly, let's try a different approach
    // We'll create a simple test to see if the table exists
    console.log('🔍 Checking if customer_checkins table exists...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('customer_checkins')
      .select('id')
      .limit(1);
    
    if (checkinsError) {
      if (checkinsError.code === 'PGRST116') {
        console.log('📋 customer_checkins table does not exist - this is expected');
        console.log('💡 You need to run the migration manually in the Supabase dashboard');
        console.log('📄 Please copy the SQL from: supabase/migrations/20250131000070_create_customer_checkins_table.sql');
        console.log('🌐 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
        console.log('📝 Paste and execute the SQL migration');
      } else {
        console.error('❌ Error checking customer_checkins table:', checkinsError);
      }
    } else {
      console.log('✅ customer_checkins table already exists!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
createCustomerCheckinsTable();
