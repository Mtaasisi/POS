/**
 * SMS Configuration Checker
 * This script checks the current SMS configuration and identifies issues
 */

// Import the SMS service and Supabase client
import { smsService } from './src/services/smsService.js';
import { supabase } from './src/lib/supabaseClient.js';

async function checkSMSConfiguration() {
  console.log('🔍 SMS Configuration Diagnostic');
  console.log('================================\n');

  try {
    // Step 1: Check SMS settings in database
    console.log('1. Checking SMS settings in database...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .or('key.eq.sms_provider_api_key,key.eq.sms_api_url,key.eq.sms_price');

    if (settingsError) {
      console.error('❌ Error fetching SMS settings:', settingsError.message);
      return false;
    }

    console.log('📋 SMS Settings Found:');
    if (settings && settings.length > 0) {
      const smsConfig = {};
      settings.forEach(setting => {
        smsConfig[setting.key] = setting.value;
        const status = setting.value ? '✅ Set' : '❌ Missing';
        console.log(`   ${setting.key}: ${status}`);
        if (setting.value && setting.key.includes('key')) {
          console.log(`      Value: ${setting.value.substring(0, 20)}...`);
        } else if (setting.value) {
          console.log(`      Value: ${setting.value}`);
        }
      });

      // Check if configuration is complete
      const hasApiKey = !!smsConfig.sms_provider_api_key;
      const hasApiUrl = !!smsConfig.sms_api_url;
      
      if (!hasApiKey || !hasApiUrl) {
        console.log('\n⚠️  SMS Configuration Issues:');
        if (!hasApiKey) console.log('   - Missing SMS API Key');
        if (!hasApiUrl) console.log('   - Missing SMS API URL');
        console.log('\n💡 To fix this, add the missing settings to your database:');
        console.log('   INSERT INTO settings (key, value) VALUES ');
        if (!hasApiKey) console.log("   ('sms_provider_api_key', 'your_api_key_here'),");
        if (!hasApiUrl) console.log("   ('sms_api_url', 'https://your-sms-provider.com/api/send'),");
        console.log("   ('sms_price', '15');");
        return false;
      }
    } else {
      console.log('   ❌ No SMS settings found in database');
      console.log('\n💡 To configure SMS, add these settings to your database:');
      console.log('   INSERT INTO settings (key, value) VALUES ');
      console.log("   ('sms_provider_api_key', 'your_api_key_here'),");
      console.log("   ('sms_api_url', 'https://your-sms-provider.com/api/send'),");
      console.log("   ('sms_price', '15');");
      return false;
    }

    // Step 2: Check SMS logs table
    console.log('\n2. Checking SMS logs table...');
    const { data: logsData, error: logsError } = await supabase
      .from('sms_logs')
      .select('id, status, created_at, error_message')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ Error accessing SMS logs table:', logsError.message);
      console.log('💡 The sms_logs table might not exist. Check your database schema.');
      return false;
    }

    console.log('📊 Recent SMS Activity:');
    if (logsData && logsData.length > 0) {
      logsData.forEach((log, index) => {
        const status = log.status === 'sent' ? '✅' : 
                      log.status === 'failed' ? '❌' : 
                      log.status === 'pending' ? '⏳' : '❓';
        console.log(`   ${index + 1}. ${status} ${log.status} (${log.created_at})`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
      });

      // Check for recent failures
      const recentFailures = logsData.filter(log => 
        log.status === 'failed' && 
        new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      if (recentFailures.length > 0) {
        console.log(`\n⚠️  Found ${recentFailures.length} failed SMS in the last 24 hours`);
        recentFailures.forEach(failure => {
          console.log(`   - ${failure.created_at}: ${failure.error_message || 'Unknown error'}`);
        });
      }
    } else {
      console.log('   📊 No SMS logs found (this is normal for a new setup)');
    }

    // Step 3: Test SMS service initialization
    console.log('\n3. Testing SMS service...');
    try {
      // Try to send a test SMS (this will fail gracefully if not configured)
      const testResult = await smsService.sendSMS('255700000000', 'Test message - configuration check', { ai_enhanced: false });
      
      if (testResult.success) {
        console.log('✅ SMS service is working correctly');
      } else {
        console.log('⚠️  SMS service returned error:', testResult.error);
        if (testResult.error.includes('not configured')) {
          console.log('💡 This is expected if SMS provider is not configured');
        }
      }
    } catch (error) {
      console.log('⚠️  SMS service test failed:', error.message);
    }

    // Step 4: Check SMS templates
    console.log('\n4. Checking SMS templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('sms_templates')
      .select('id, name, is_active')
      .limit(5);

    if (templatesError) {
      console.log('⚠️  SMS templates table not accessible:', templatesError.message);
    } else if (templates && templates.length > 0) {
      console.log(`📝 Found ${templates.length} SMS templates:`);
      templates.forEach((template, index) => {
        const status = template.is_active ? '✅ Active' : '❌ Inactive';
        console.log(`   ${index + 1}. ${template.name} - ${status}`);
      });
    } else {
      console.log('📝 No SMS templates found');
    }

    console.log('\n🎉 SMS Configuration Check Complete!');
    return true;

  } catch (error) {
    console.error('❌ SMS configuration check failed:', error.message);
    return false;
  }
}

// Run the check
checkSMSConfiguration()
  .then(success => {
    if (success) {
      console.log('\n✅ SMS system appears to be properly configured');
      console.log('💡 You can now test SMS functionality through the web interface');
    } else {
      console.log('\n❌ SMS system needs configuration');
      console.log('💡 Follow the instructions above to configure SMS settings');
    }
  })
  .catch(error => {
    console.error('\n💥 Configuration check failed:', error);
  });

export { checkSMSConfiguration };
