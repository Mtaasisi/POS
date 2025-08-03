import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomersAccess() {
  console.log('🔍 Testing customers table access...');
  
  try {
    // Test 1: Check if table exists and is accessible
    console.log('\n1. Testing basic table access...');
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error accessing customers table:', countError);
      return;
    }
    
    console.log(`✅ Customers table accessible. Total customers: ${count || 0}`);
    
    // Test 2: Try to fetch a few customers
    console.log('\n2. Testing customer data fetch...');
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching customers:', fetchError);
      return;
    }
    
    console.log(`✅ Successfully fetched ${customers?.length || 0} customers`);
    if (customers && customers.length > 0) {
      customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} (${customer.phone})`);
      });
    } else {
      console.log('   No customers found in database');
    }
    
    // Test 3: Test search functionality
    console.log('\n3. Testing customer search...');
    const { data: searchResults, error: searchError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%a%,phone.ilike.%a%')
      .limit(3);
    
    if (searchError) {
      console.error('❌ Error searching customers:', searchError);
      return;
    }
    
    console.log(`✅ Search test successful. Found ${searchResults?.length || 0} customers with 'a' in name or phone`);
    
    console.log('\n✅ All tests passed! Customers table is working correctly.');
    
  } catch (error) {
    console.error('❌ Exception during testing:', error);
  }
}

testCustomersAccess(); 