import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to fix 400 errors...');
  
  try {
    // First, let's check what columns exist in the customers table
    console.log('1️⃣ Checking current customers table structure...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.error('❌ Error checking customers table:', customersError);
      return;
    }
    
    if (customers && customers.length > 0) {
      const customer = customers[0];
      console.log('📋 Current customers table columns:');
      Object.keys(customer).forEach(key => {
        console.log(`   - ${key}: ${typeof customer[key]}`);
      });
    }
    
    // Test if email column exists
    console.log('\n2️⃣ Testing if email column exists...');
    try {
      const { data: emailTest, error: emailError } = await supabase
        .from('customers')
        .select('email')
        .limit(1);
      
      if (emailError) {
        console.log('❌ Email column does not exist - this is causing the 400 errors');
        console.log('💡 You need to add the email column to the customers table');
        console.log('🔧 You can do this by running the SQL migration in your Supabase dashboard');
      } else {
        console.log('✅ Email column exists');
      }
    } catch (error) {
      console.log('❌ Email column does not exist');
    }
    
    // Test if other missing columns exist
    const missingColumns = [
      'whatsapp', 'birth_month', 'birth_day', 'referral_source', 
      'initial_notes', 'total_returns', 'profile_image', 
      'last_purchase_date', 'total_purchases', 'birthday'
    ];
    
    console.log('\n3️⃣ Checking for other missing columns...');
    for (const column of missingColumns) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ Column '${column}' is missing`);
        } else {
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (error) {
        console.log(`❌ Column '${column}' is missing`);
      }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('The 400 errors are caused by missing columns in the customers table.');
    console.log('You need to run the SQL migration to add these missing columns.');
    console.log('You can do this by:');
    console.log('1. Going to your Supabase dashboard');
    console.log('2. Opening the SQL editor');
    console.log('3. Running the contents of fix-400-errors-safe.sql');
    console.log('4. Or using the Supabase CLI if you have it set up');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the function
addMissingColumns().then(() => {
  console.log('\n🏁 Analysis completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Analysis failed:', error);
  process.exit(1);
});
