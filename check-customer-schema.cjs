const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerSchema() {
  try {
    console.log('🔍 Checking customers table schema...');
    
    // Get all columns from the customers table
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'customers')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Error fetching schema:', error);
      return;
    }
    
    console.log('📋 Customers table columns:');
    console.log('='.repeat(80));
    
    columns.forEach((col, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'.padEnd(8)} | ${col.column_default || 'NULL'}`);
    });
    
    console.log('='.repeat(80));
    console.log(`Total columns: ${columns.length}`);
    
    // Check for specific fields that might be missing
    const requiredFields = [
      'id', 'name', 'email', 'phone', 'gender', 'city', 'joined_date', 
      'loyalty_level', 'color_tag', 'referred_by', 'total_spent', 'points', 
      'last_visit', 'is_active', 'whatsapp', 'birth_month', 'birth_day', 
      'referral_source', 'initial_notes', 'total_returns', 'profile_image', 
      'created_at', 'updated_at'
    ];
    
    console.log('\n🔍 Checking for required fields:');
    console.log('-'.repeat(50));
    
    const existingFields = columns.map(col => col.column_name);
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields exist!');
    } else {
      console.log('❌ Missing fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
    }
    
    // Test a minimal query to see what works
    console.log('\n🧪 Testing minimal query...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .limit(1);
    
    if (testError) {
      console.log('❌ Minimal query failed:', testError.message);
    } else {
      console.log('✅ Minimal query succeeded:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCustomerSchema();
