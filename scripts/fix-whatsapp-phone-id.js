#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function fixWhatsAppPhoneId() {
  console.log('\n🔧 WhatsApp Business API Phone Number ID Fix\n');
  console.log('===========================================\n');

  try {
    // Check current phone number ID
    const { data: currentSetting, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_business_phone_number_id')
      .single();

    if (error) {
      console.error('❌ Error fetching current phone number ID:', error);
      rl.close();
      return;
    }

    const currentPhoneId = currentSetting?.value;
    console.log(`Current Phone Number ID: ${currentPhoneId || 'Not set'}`);

    if (currentPhoneId === 'yes') {
      console.log('❌ Detected incorrect phone number ID: "yes"');
      console.log('This is causing the 401 Unauthorized errors.\n');
    } else if (!currentPhoneId) {
      console.log('❌ Phone Number ID is not set');
    } else {
      console.log('✅ Phone Number ID appears to be set correctly');
      console.log('If you\'re still getting errors, you may need to update it.\n');
    }

    // Get new phone number ID
    console.log('📋 To get your Phone Number ID:');
    console.log('1. Go to https://developers.facebook.com');
    console.log('2. Navigate to your WhatsApp Business App');
    console.log('3. Go to WhatsApp > Phone Numbers');
    console.log('4. Copy the Phone Number ID (it should be a numeric string)\n');

    const newPhoneId = await question('Enter your Phone Number ID: ');
    
    if (!newPhoneId.trim()) {
      console.log('❌ Phone Number ID cannot be empty');
      rl.close();
      return;
    }

    // Validate format
    if (!/^\d+$/.test(newPhoneId.trim())) {
      console.log('❌ Phone Number ID should be numeric only');
      console.log('Example: 123456789');
      rl.close();
      return;
    }

    // Update the setting
    const { error: updateError } = await supabase
      .from('settings')
      .upsert({
        key: 'whatsapp_business_phone_number_id',
        value: newPhoneId.trim()
      }, { onConflict: 'key' });

    if (updateError) {
      console.error('❌ Error updating phone number ID:', updateError);
      rl.close();
      return;
    }

    console.log('✅ Phone Number ID updated successfully!');
    console.log(`New Phone Number ID: ${newPhoneId.trim()}`);

    // Test the new configuration
    console.log('\n🧪 Testing new configuration...');
    const apiVersion = 'v18.0';
    const testUrl = `https://graph.facebook.com/${apiVersion}/${newPhoneId.trim()}`;
    console.log(`Test URL: ${testUrl}`);

    console.log('\n📋 Next steps:');
    console.log('1. Go to your app and test the WhatsApp Business API connection');
    console.log('2. If you still get errors, check your access token');
    console.log('3. Make sure your phone number is verified in Meta Developer Console');

    console.log('\n✅ Fix complete!\n');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    rl.close();
  }
}

// Run the fix script
fixWhatsAppPhoneId();
