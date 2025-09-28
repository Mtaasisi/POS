// Check Supabase configuration and connection
const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseConfig() {
  console.log('🔍 Checking Supabase Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
  
  // Try to initialize client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
  
  console.log(`\n🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    console.log('\n📊 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test authentication
    console.log('\n📊 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Authentication error:', authError.message);
      console.log('This might be expected if using anonymous access');
    } else {
      console.log('✅ Authentication successful');
      console.log('User:', authData.user ? 'Logged in' : 'Anonymous');
    }
    
    // Test RLS policies
    console.log('\n📊 Testing RLS policies...');
    const { data: rlsTestData, error: rlsTestError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);
    
    if (rlsTestError) {
      console.error('❌ RLS test failed:', rlsTestError);
    } else {
      console.log(`✅ RLS test successful: ${rlsTestData?.length || 0} customers accessible`);
    }
    
    // Test different select patterns
    console.log('\n📊 Testing different select patterns...');
    
    // Pattern 1: Minimal select
    const { data: minimalData, error: minimalError } = await supabase
      .from('customers')
      .select('id')
      .limit(10);
    
    console.log(`Minimal select: ${minimalData?.length || 0} customers`);
    
    // Pattern 2: Full select (like the app)
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
    
    console.log(`Full select: ${fullData?.length || 0} customers`);
    
    if (fullError) {
      console.error('❌ Full select error:', fullError);
    }
    
    // Pattern 3: Count query
    const { count: countData, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Count query: ${countData || 0} total customers`);
    
    if (countError) {
      console.error('❌ Count query error:', countError);
    }
    
    // Test network connectivity
    console.log('\n📊 Testing network connectivity...');
    const startTime = Date.now();
    const { data: networkData, error: networkError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    const endTime = Date.now();
    
    if (networkError) {
      console.error('❌ Network test failed:', networkError);
    } else {
      console.log(`✅ Network test successful: ${endTime - startTime}ms response time`);
    }
    
  } catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
  }
}

// Run the check
checkSupabaseConfig();
