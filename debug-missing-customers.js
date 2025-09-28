// Debug script to investigate missing customers
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMissingCustomers() {
  console.log('🔍 Debugging Missing Customers Issue...\n');

  try {
    // Test 1: Check total customer count
    console.log('📊 Test 1: Checking total customer count...');
    const { count: totalCount, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting customers:', countError);
    } else {
      console.log(`✅ Total customers in database: ${totalCount}\n`);
    }

    // Test 2: Check customers with different select methods
    console.log('📋 Test 2: Testing different select methods...');
    
    // Method 1: Simple select
    const { data: simpleData, error: simpleError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .limit(10);
    
    if (simpleError) {
      console.error('❌ Simple select error:', simpleError);
    } else {
      console.log(`✅ Simple select: ${simpleData?.length || 0} customers found`);
      if (simpleData && simpleData.length > 0) {
        console.log('Sample customers:', simpleData.slice(0, 3).map(c => ({ name: c.name, phone: c.phone })));
      }
    }

    // Method 2: Full select (like in the app)
    const { data: fullData, error: fullError } = await supabase
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
      `)
      .limit(10);
    
    if (fullError) {
      console.error('❌ Full select error:', fullError);
    } else {
      console.log(`✅ Full select: ${fullData?.length || 0} customers found\n`);
    }

    // Test 3: Check for customers with null/empty names
    console.log('🔍 Test 3: Checking for customers with null/empty names...');
    const { data: nullNameData, error: nullNameError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.is.null,name.eq.')
      .limit(10);
    
    if (nullNameError) {
      console.error('❌ Null name check error:', nullNameError);
    } else {
      console.log(`⚠️ Customers with null/empty names: ${nullNameData?.length || 0}`);
      if (nullNameData && nullNameData.length > 0) {
        console.log('Null name customers:', nullNameData);
      }
    }

    // Test 4: Check for customers with null/empty phones
    console.log('📱 Test 4: Checking for customers with null/empty phones...');
    const { data: nullPhoneData, error: nullPhoneError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('phone.is.null,phone.eq.')
      .limit(10);
    
    if (nullPhoneError) {
      console.error('❌ Null phone check error:', nullPhoneError);
    } else {
      console.log(`⚠️ Customers with null/empty phones: ${nullPhoneData?.length || 0}`);
      if (nullPhoneData && nullPhoneData.length > 0) {
        console.log('Null phone customers:', nullPhoneData);
      }
    }

    // Test 5: Check RLS policies
    console.log('🔒 Test 5: Checking RLS policies...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_policies', { table_name: 'customers' });
    
    if (rlsError) {
      console.log('⚠️ Could not check RLS policies (function may not exist)');
    } else {
      console.log('✅ RLS policies check:', rlsData);
    }

    // Test 6: Check recent customers
    console.log('📅 Test 6: Checking recent customers...');
    const { data: recentData, error: recentError } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Recent customers error:', recentError);
    } else {
      console.log(`✅ Recent customers: ${recentData?.length || 0} found`);
      if (recentData && recentData.length > 0) {
        console.log('Recent customers:', recentData.map(c => ({ 
          name: c.name, 
          phone: c.phone, 
          created: c.created_at 
        })));
      }
    }

    // Test 7: Check for duplicate customers
    console.log('🔄 Test 7: Checking for duplicate customers...');
    const { data: duplicateData, error: duplicateError } = await supabase
      .from('customers')
      .select('name, phone, count(*)')
      .group('name, phone')
      .having('count(*) > 1')
      .limit(10);
    
    if (duplicateError) {
      console.log('⚠️ Could not check duplicates (group by may not be supported)');
    } else {
      console.log(`✅ Duplicate customers: ${duplicateData?.length || 0} found`);
    }

    console.log('\n🎯 Summary:');
    console.log(`- Total customers: ${totalCount || 'Unknown'}`);
    console.log(`- Simple select works: ${simpleData ? 'Yes' : 'No'}`);
    console.log(`- Full select works: ${fullData ? 'Yes' : 'No'}`);
    console.log(`- Null names: ${nullNameData?.length || 0}`);
    console.log(`- Null phones: ${nullPhoneData?.length || 0}`);
    console.log(`- Recent customers: ${recentData?.length || 0}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugMissingCustomers();
