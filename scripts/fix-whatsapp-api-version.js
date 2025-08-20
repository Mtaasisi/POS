#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixWhatsAppApiVersion() {
  console.log('\n🔧 WhatsApp Business API Version Fix\n');
  console.log('===================================\n');

  try {
    // Check current API version
    const { data: currentSetting, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_business_api_version')
      .single();

    if (error) {
      console.error('❌ Error fetching current API version:', error);
      return;
    }

    const currentApiVersion = currentSetting?.value;
    console.log(`Current API Version: ${currentApiVersion || 'Not set'}`);

    if (currentApiVersion === 'yes') {
      console.log('❌ Detected incorrect API version: "yes"');
      console.log('This is causing the malformed URLs and 401 errors.\n');
    } else if (!currentApiVersion) {
      console.log('❌ API version is not set');
    } else {
      console.log('✅ API version appears to be set correctly');
      console.log('If you\'re still getting errors, you may need to update it.\n');
    }

    // Fix the API version
    const correctApiVersion = 'v18.0';
    console.log(`Setting API version to: ${correctApiVersion}`);

    const { error: updateError } = await supabase
      .from('settings')
      .upsert({
        key: 'whatsapp_business_api_version',
        value: correctApiVersion
      }, { onConflict: 'key' });

    if (updateError) {
      console.error('❌ Error updating API version:', updateError);
      return;
    }

    console.log('✅ API version updated successfully!');

    // Test the new configuration
    console.log('\n🧪 Testing new configuration...');
    const phoneNumberId = '100948499751706'; // From your current config
    const testUrl = `https://graph.facebook.com/${correctApiVersion}/${phoneNumberId}`;
    console.log(`Test URL: ${testUrl}`);

    console.log('\n📋 Next steps:');
    console.log('1. Refresh your app to reload the configuration');
    console.log('2. Test the WhatsApp Business API connection');
    console.log('3. The 401 errors should now be resolved');

    console.log('\n✅ Fix complete!\n');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix script
fixWhatsAppApiVersion();
