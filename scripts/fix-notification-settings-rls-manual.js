import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseNotificationSettingsIssue() {
  console.log('🔍 Diagnosing notification_settings 406 error...\n');

  try {
    // Test basic table access
    console.log('🧪 Testing basic table access...');
    const { data: testData, error: testError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Basic access test failed:', testError.message);
      console.log('🔍 Error details:', testError);
    } else {
      console.log('✅ Basic table access works');
    }

    // Test with user_id filter (this is what's failing in the browser)
    console.log('🧪 Testing user_id filtered access...');
    const { data: filteredData, error: filteredError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', 'test-user-id');

    if (filteredError) {
      console.log('❌ Filtered access test failed:', filteredError.message);
      console.log('🔍 This is likely the RLS policy issue causing the 406 error');
    } else {
      console.log('✅ Filtered table access works');
    }

    // Check if we can get the current user
    console.log('👤 Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️ No authenticated user found');
      console.log('💡 This is expected in a script context');
    } else {
      console.log(`✅ Found authenticated user: ${user.email}`);
      
      // Test with actual user ID
      console.log('🧪 Testing with actual user ID...');
      const { data: userData, error: userDataError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id);

      if (userDataError) {
        console.log('❌ User-specific access failed:', userDataError.message);
      } else {
        console.log('✅ User-specific access works');
        if (userData && userData.length > 0) {
          console.log(`📋 Found ${userData.length} notification settings records`);
        } else {
          console.log('📋 No notification settings records found for user');
        }
      }
    }

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=====================');
    console.log('The 406 error is likely caused by missing or incorrect RLS policies.');
    console.log('The notification_settings table exists but may not have proper access controls.');
    
    console.log('\n🔧 MANUAL FIX REQUIRED:');
    console.log('======================');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Policies');
    console.log('3. Find the notification_settings table');
    console.log('4. Add the following RLS policies:');
    console.log('');
    console.log('   Policy Name: "Users can view their own notification settings"');
    console.log('   Operation: SELECT');
    console.log('   Target roles: authenticated');
    console.log('   Using expression: auth.uid() = user_id');
    console.log('');
    console.log('   Policy Name: "Users can insert their own notification settings"');
    console.log('   Operation: INSERT');
    console.log('   Target roles: authenticated');
    console.log('   Using expression: auth.uid() = user_id');
    console.log('');
    console.log('   Policy Name: "Users can update their own notification settings"');
    console.log('   Operation: UPDATE');
    console.log('   Target roles: authenticated');
    console.log('   Using expression: auth.uid() = user_id');
    console.log('');
    console.log('   Policy Name: "Users can delete their own notification settings"');
    console.log('   Operation: DELETE');
    console.log('   Target roles: authenticated');
    console.log('   Using expression: auth.uid() = user_id');
    console.log('');
    console.log('5. Enable RLS on the notification_settings table if not already enabled');
    console.log('');
    console.log('💡 ALTERNATIVE: Apply the migration file manually');
    console.log('   - Copy the SQL from supabase/migrations/20241204000001_fix_notification_settings_rls.sql');
    console.log('   - Run it in the Supabase SQL editor');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseNotificationSettingsIssue();
