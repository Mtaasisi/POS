import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFixDirect() {
  console.log('🚀 Applying POS Settings Schema Fix...');

  try {
    // First, let's check current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('ℹ️ No authenticated user, proceeding with schema checks...');
    } else {
      console.log('✅ Authenticated user:', user.email);
    }

    // Try to run a simple query to check database connectivity
    console.log('🔍 Testing database connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('lats_pos_general_settings')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connectivity issue:', testError.message);
    } else {
      console.log('✅ Database connection successful');
    }

    // Check if we can access the problematic tables
    console.log('📋 Checking lats_pos_loyalty_customer_settings table...');
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .select('id')
      .limit(1);

    if (loyaltyError) {
      console.log('⚠️ Loyalty table access issue:', loyaltyError.message);
    } else {
      console.log('✅ Loyalty table accessible');
    }

    console.log('📊 Checking lats_pos_analytics_reporting_settings table...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .select('id')
      .limit(1);

    if (analyticsError) {
      console.log('⚠️ Analytics table access issue:', analyticsError.message);
    } else {
      console.log('✅ Analytics table accessible');
    }

    // Try to create a minimal test record to see what columns are missing
    console.log('🧪 Testing minimal record creation...');
    
    // Test with only basic columns
    const minimalLoyaltyData = {
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      business_id: null,
      enable_loyalty_program: true
    };

    const { error: minimalLoyaltyError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .insert(minimalLoyaltyData);

    if (minimalLoyaltyError) {
      console.log('❌ Minimal loyalty insert failed:', minimalLoyaltyError.message);
    } else {
      console.log('✅ Minimal loyalty insert successful');
    }

    const minimalAnalyticsData = {
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      business_id: null,
      enable_sales_analytics: true
    };

    const { error: minimalAnalyticsError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .insert(minimalAnalyticsData);

    if (minimalAnalyticsError) {
      console.log('❌ Minimal analytics insert failed:', minimalAnalyticsError.message);
    } else {
      console.log('✅ Minimal analytics insert successful');
    }

    console.log('');
    console.log('📝 MANUAL FIX INSTRUCTIONS:');
    console.log('Since we cannot modify the schema directly, please:');
    console.log('');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Open "SQL Editor"');
    console.log('4. Copy and paste the SQL from: scripts/fix-pos-settings-manual.sql');
    console.log('5. Click "Run" to execute the SQL');
    console.log('');
    console.log('This will add all missing columns and resolve the 400 errors.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

applySchemaFixDirect()
  .then(() => {
    console.log('✅ Schema fix analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
