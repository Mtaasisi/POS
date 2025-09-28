import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImportStatus() {
  console.log('🔍 Checking import status...\n');
  
  try {
    // Count total customers
    const { count: totalCustomers, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting customers:', countError.message);
      return;
    }
    
    console.log(`📊 Total customers in database: ${totalCustomers}`);
    
    // Count imported customers (those with referral_source = 'Contact Import')
    const { count: importedCustomers, error: importedError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('referral_source', 'Contact Import');
    
    if (importedError) {
      console.error('❌ Error counting imported customers:', importedError.message);
      return;
    }
    
    console.log(`✅ Imported customers (from CSV): ${importedCustomers}`);
    console.log(`📈 Import success rate: ${((importedCustomers / 73079) * 100).toFixed(1)}%`);
    
    // Get some sample imported customers
    const { data: sampleCustomers, error: sampleError } = await supabase
      .from('customers')
      .select('name, phone, created_at, referral_source')
      .eq('referral_source', 'Contact Import')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample customers:', sampleError.message);
      return;
    }
    
    console.log('\n📋 Recent imported customers:');
    sampleCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} - ${customer.phone} (${customer.created_at})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking import status:', error);
  }
}

checkImportStatus();

