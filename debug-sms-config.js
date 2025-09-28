// Debug SMS Configuration
// Run this in your browser console to check what SMS settings are loaded

async function debugSMSConfig() {
  console.log('🔍 Debugging SMS Configuration...');
  
  try {
    // Import the SMS service
    const { smsService } = await import('./src/services/smsService.ts');
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📋 SMS Service Debug Info:');
    console.log('   API Key:', smsService.apiKey || 'null');
    console.log('   API URL:', smsService.apiUrl || 'null');
    console.log('   API Password:', smsService.apiPassword || 'null');
    console.log('   Initialized:', smsService.initialized || 'false');
    
    // Also check what's in the database directly
    console.log('\n🔍 Checking database directly...');
    
    // Import Supabase client
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    
    // You'll need to replace these with your actual Supabase credentials
    const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['sms_provider_api_key', 'sms_provider_password', 'sms_api_url']);
    
    if (error) {
      console.error('❌ Error fetching settings:', error);
    } else {
      console.log('📋 Database Settings:');
      settings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugSMSConfig();
