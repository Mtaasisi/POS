/**
 * SMS Setup Helper
 * This script helps you configure SMS settings in your database
 */

import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSMS() {
  console.log('🔧 SMS Setup Helper');
  console.log('==================');
  
  try {
    // Check if settings table exists and has SMS settings
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('key, value')
      .or('key.eq.sms_provider_api_key,key.eq.sms_api_url');

    if (checkError) {
      console.error('❌ Error checking existing settings:', checkError);
      return;
    }

    console.log('📋 Current SMS settings:');
    if (existingSettings && existingSettings.length > 0) {
      existingSettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value ? '✅ Set' : '❌ Empty'}`);
      });
    } else {
      console.log('   No SMS settings found');
    }

    console.log('\n💡 To configure SMS, you need to:');
    console.log('1. Choose an SMS provider (recommended for Tanzania):');
    console.log('   - Mobishastra: https://mshastra.com/sendurl.aspx');
    console.log('   - SMS Tanzania: https://api.smstanzania.com/send');
    console.log('   - BulkSMS: https://api.bulksms.com/send');
    
    console.log('\n2. Get your API credentials from the provider');
    
    console.log('\n3. Add these settings to your database:');
    console.log('   INSERT INTO settings (key, value) VALUES ');
    console.log('   (\'sms_provider_api_key\', \'your_api_key_here\'),');
    console.log('   (\'sms_api_url\', \'https://your-sms-provider.com/api/send\'),');
    console.log('   (\'sms_price\', \'15\');');
    
    console.log('\n4. For testing, you can use:');
    console.log('   - Test phone: 255700000000');
    console.log('   - Test API URL: https://httpbin.org/post (for testing)');
    
    console.log('\n5. After configuration, restart your app and test SMS');
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run the setup
setupSMS();
