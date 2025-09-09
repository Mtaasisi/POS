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
    
    // Test different field combinations to see what exists
    const fieldTests = [
      { name: 'Basic fields', fields: 'id, name, email, phone' },
      { name: 'Extended fields', fields: 'id, name, email, phone, gender, city' },
      { name: 'Date fields', fields: 'id, name, joined_date, last_visit, created_at, updated_at' },
      { name: 'Loyalty fields', fields: 'id, name, loyalty_level, color_tag, points, total_spent' },
      { name: 'Reference fields', fields: 'id, name, referred_by, referral_source' },
      { name: 'Status fields', fields: 'id, name, is_active, whatsapp' },
      { name: 'Birth fields', fields: 'id, name, birth_month, birth_day' },
      { name: 'Notes fields', fields: 'id, name, initial_notes' },
      { name: 'New fields', fields: 'id, name, total_returns, profile_image' },
      { name: 'All fields', fields: 'id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at' }
    ];
    
    const results = [];
    
    for (const test of fieldTests) {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`Fields: ${test.fields}`);
      
      const { data, error } = await supabase
        .from('customers')
        .select(test.fields)
        .limit(1);
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
        results.push({ test: test.name, success: false, error: error.message });
      } else {
        console.log(`✅ Success: ${data?.length || 0} records`);
        results.push({ test: test.name, success: true, data: data });
      }
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.success ? 'PASS' : result.error}`);
    });
    
    // Find the working fields
    const workingTests = results.filter(r => r.success);
    if (workingTests.length > 0) {
      console.log('\n🎯 Working field combinations:');
      workingTests.forEach(test => {
        console.log(`- ${test.test}`);
      });
    }
    
    // Find the failing tests
    const failingTests = results.filter(r => !r.success);
    if (failingTests.length > 0) {
      console.log('\n❌ Failing field combinations:');
      failingTests.forEach(test => {
        console.log(`- ${test.test}: ${test.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCustomerSchema();
