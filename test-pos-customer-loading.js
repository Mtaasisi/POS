// Comprehensive test for POS customer loading issues
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPOSCustomerLoading() {
  console.log('🔍 Comprehensive POS Customer Loading Test...\n');

  try {
    // Test 1: Direct database query (what the app should see)
    console.log('📊 Test 1: Direct database query...');
    const { data: directData, error: directError, count: directCount } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        gender,
        city,
        color_tag,
        loyalty_level,
        points,
        total_spent,
        last_visit,
        is_active,
        referral_source,
        birth_month,
        birth_day,
        total_returns,
        profile_image,
        whatsapp,
        whatsapp_opt_out,
        initial_notes,
        notes,
        referrals,
        customer_tag,
        created_at,
        updated_at,
        created_by,
        last_purchase_date,
        total_purchases,
        birthday,
        referred_by
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (directError) {
      console.error('❌ Direct query error:', directError);
    } else {
      console.log(`✅ Direct query: ${directData?.length || 0} customers (total: ${directCount})`);
      
      if (directData && directData.length > 0) {
        console.log('Sample customers from direct query:');
        directData.slice(0, 5).forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${customer.email || 'No email'}`);
        });
      }
    }

    // Test 2: Simple query (minimal fields)
    console.log('\n📊 Test 2: Simple query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .order('created_at', { ascending: false });

    if (simpleError) {
      console.error('❌ Simple query error:', simpleError);
    } else {
      console.log(`✅ Simple query: ${simpleData?.length || 0} customers`);
    }

    // Test 3: Check for customers with different is_active values
    console.log('\n📊 Test 3: Check is_active values...');
    const { data: activeData, error: activeError } = await supabase
      .from('customers')
      .select('id, name, is_active')
      .order('created_at', { ascending: false });

    if (activeData) {
      const activeCount = activeData.filter(c => c.is_active === true).length;
      const inactiveCount = activeData.filter(c => c.is_active === false).length;
      const nullCount = activeData.filter(c => c.is_active === null).length;
      
      console.log(`✅ Active customers: ${activeCount}`);
      console.log(`✅ Inactive customers: ${inactiveCount}`);
      console.log(`✅ Null is_active: ${nullCount}`);
    }

    // Test 4: Check for customers with missing critical data
    console.log('\n📊 Test 4: Check data quality...');
    if (directData) {
      const customersWithNames = directData.filter(c => c.name && c.name.trim());
      const customersWithPhones = directData.filter(c => c.phone && c.phone.trim());
      const customersWithEmails = directData.filter(c => c.email && c.email.trim());
      
      console.log(`✅ Customers with names: ${customersWithNames.length}/${directData.length}`);
      console.log(`✅ Customers with phones: ${customersWithPhones.length}/${directData.length}`);
      console.log(`✅ Customers with emails: ${customersWithEmails.length}/${directData.length}`);
      
      // Check for customers with "Unknown Customer" names
      const unknownCustomers = directData.filter(c => c.name === 'Unknown Customer');
      console.log(`⚠️ Customers with "Unknown Customer" name: ${unknownCustomers.length}`);
      
      // Check for customers with NO_PHONE_ prefix
      const noPhoneCustomers = directData.filter(c => c.phone && c.phone.startsWith('NO_PHONE_'));
      console.log(`⚠️ Customers with NO_PHONE_ prefix: ${noPhoneCustomers.length}`);
    }

    // Test 5: Test pagination (like the app does)
    console.log('\n📊 Test 5: Test pagination...');
    const { data: page1Data, error: page1Error } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .range(0, 49) // First 50 customers
      .order('created_at', { ascending: false });

    if (page1Error) {
      console.error('❌ Page 1 error:', page1Error);
    } else {
      console.log(`✅ Page 1 (0-49): ${page1Data?.length || 0} customers`);
    }

    // Test 6: Test search functionality
    console.log('\n📊 Test 6: Test search functionality...');
    const { data: searchData, error: searchError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%a%,phone.ilike.%a%,email.ilike.%a%')
      .limit(10);

    if (searchError) {
      console.error('❌ Search error:', searchError);
    } else {
      console.log(`✅ Search results: ${searchData?.length || 0} customers`);
    }

    // Test 7: Check for any RLS policy issues
    console.log('\n📊 Test 7: Check RLS policies...');
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_policies', { table_name: 'customers' });
      
      if (rlsError) {
        console.log('⚠️ Could not check RLS policies (function may not exist)');
      } else {
        console.log('✅ RLS policies:', rlsData);
      }
    } catch (e) {
      console.log('⚠️ RLS check failed:', e.message);
    }

    // Test 8: Check recent customers specifically
    console.log('\n📊 Test 8: Check recent customers...');
    const { data: recentData, error: recentError } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Recent customers error:', recentError);
    } else {
      console.log(`✅ Recent customers (last 30 days): ${recentData?.length || 0}`);
      
      if (recentData && recentData.length > 0) {
        console.log('Recent customers:');
        recentData.slice(0, 5).forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${new Date(customer.created_at).toLocaleDateString()}`);
        });
      }
    }

    // Summary
    console.log('\n🎯 Summary:');
    console.log(`- Direct query: ${directData?.length || 0} customers`);
    console.log(`- Simple query: ${simpleData?.length || 0} customers`);
    console.log(`- Page 1: ${page1Data?.length || 0} customers`);
    console.log(`- Search results: ${searchData?.length || 0} customers`);
    console.log(`- Recent customers: ${recentData?.length || 0} customers`);
    
    if (directData && directData.length > 0) {
      console.log(`- Data quality: ${directData.filter(c => c.name && c.name.trim()).length}/${directData.length} have valid names`);
      console.log(`- Phone quality: ${directData.filter(c => c.phone && c.phone.trim()).length}/${directData.length} have valid phones`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testPOSCustomerLoading();

