// Update SMS Settings Script
// Run this in your browser console to update SMS settings

async function updateSMSSettings() {
  console.log('🔧 Updating SMS Settings...');
  
  try {
    // Import Supabase client
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    
    // You'll need to replace these with your actual Supabase credentials
    const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update API Key
    const { error: keyError } = await supabase
      .from('settings')
      .update({ value: 'Inauzwa', updated_at: new Date().toISOString() })
      .eq('key', 'sms_provider_api_key');
    
    if (keyError) {
      console.error('❌ Error updating API key:', keyError);
    } else {
      console.log('✅ Updated API key to: Inauzwa');
    }
    
    // Update Password
    const { error: passwordError } = await supabase
      .from('settings')
      .upsert([
        { key: 'sms_provider_password', value: '@Masika10', updated_at: new Date().toISOString() }
      ]);
    
    if (passwordError) {
      console.error('❌ Error updating password:', passwordError);
    } else {
      console.log('✅ Updated password to: @Masika10');
    }
    
    // Verify settings
    const { data: settings, error: fetchError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['sms_provider_api_key', 'sms_provider_password', 'sms_api_url']);
    
    if (fetchError) {
      console.error('❌ Error fetching settings:', fetchError);
    } else {
      console.log('📋 Current SMS Settings:');
      settings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value}`);
      });
    }
    
    console.log('🎉 SMS settings updated! Try sending an SMS now.');
    
  } catch (error) {
    console.error('❌ Error updating SMS settings:', error);
  }
}

// Run the update
updateSMSSettings();
