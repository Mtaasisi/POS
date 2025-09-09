const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerQueries() {
  try {
    console.log('🧪 Testing customer queries (without whatsapp field)...');
    
    // Test 1: Simple query (like the one that was failing)
    console.log('1️⃣ Testing simple customer query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
      `)
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (simpleError) {
      console.log('❌ Simple query failed:', simpleError.message);
      return false;
    } else {
      console.log('✅ Simple query succeeded:', simpleData?.length || 0, 'records');
    }
    
    // Test 2: Pagination query
    console.log('2️⃣ Testing pagination query...');
    const { data: paginatedData, error: paginatedError } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
      `, { count: 'exact' })
      .range(0, 49)
      .order('created_at', { ascending: false });
    
    if (paginatedError) {
      console.log('❌ Pagination query failed:', paginatedError.message);
      return false;
    } else {
      console.log('✅ Pagination query succeeded:', paginatedData?.length || 0, 'records');
    }
    
    // Test 3: Search query
    console.log('3️⃣ Testing search query...');
    const { data: searchData, error: searchError } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
      `)
      .or('name.ilike.%test%,email.ilike.%test%')
      .limit(5);
    
    if (searchError) {
      console.log('❌ Search query failed:', searchError.message);
      return false;
    } else {
      console.log('✅ Search query succeeded:', searchData?.length || 0, 'records');
    }
    
    // Test 4: Individual customer query
    if (simpleData && simpleData.length > 0) {
      const customerId = simpleData[0].id;
      console.log(`4️⃣ Testing individual customer query for ${customerId}...`);
      
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        `)
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        console.log('❌ Individual customer query failed:', customerError.message);
        return false;
      } else {
        console.log('✅ Individual customer query succeeded:', customerData?.name);
      }
    }
    
    console.log('🎉 All customer queries passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Testing customer query fixes (final)...');
  
  const success = await testCustomerQueries();
  
  if (success) {
    console.log('✅ Customer query fixes are working correctly!');
    console.log('📋 Next steps:');
    console.log('1. Add the whatsapp field to the database using the SQL provided');
    console.log('2. Update the queries to include the whatsapp field again');
    console.log('3. Test the application');
  } else {
    console.log('❌ Customer query fixes still have issues.');
  }
  
  console.log('🏁 Test completed!');
}

main();
