#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugWhatsAppBusinessAPI() {
  console.log('\n🔍 WhatsApp Business API Debug Script\n');
  console.log('=====================================\n');

  try {
    // 1. Check current configuration
    console.log('1. 📋 Checking current configuration...');
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'whatsapp_business_access_token',
        'whatsapp_business_phone_number_id',
        'whatsapp_business_account_id',
        'whatsapp_business_app_id',
        'whatsapp_business_app_secret',
        'whatsapp_business_webhook_verify_token',
        'whatsapp_business_api_version',
        'whatsapp_business_enabled'
      ]);

    if (error) {
      console.error('❌ Error fetching settings:', error);
      return;
    }

    const config = {};
    settings?.forEach(item => {
      config[item.key] = item.value;
    });

    console.log('Current configuration:');
    console.log(`  Access Token: ${config.whatsapp_business_access_token ? '✓ Set' : '✗ Not set'}`);
    console.log(`  Phone Number ID: ${config.whatsapp_business_phone_number_id || '✗ Not set'}`);
    console.log(`  Business Account ID: ${config.whatsapp_business_account_id || '✗ Not set'}`);
    console.log(`  App ID: ${config.whatsapp_business_app_id || '✗ Not set'}`);
    console.log(`  App Secret: ${config.whatsapp_business_app_secret ? '✓ Set' : '✗ Not set'}`);
    console.log(`  Webhook Token: ${config.whatsapp_business_webhook_verify_token || '✗ Not set'}`);
    console.log(`  API Version: ${config.whatsapp_business_api_version || 'v18.0'}`);
    console.log(`  Enabled: ${config.whatsapp_business_enabled === 'true' ? '✓ Yes' : '✗ No'}`);

    // 2. Validate phone number ID format
    console.log('\n2. 🔍 Validating phone number ID format...');
    const phoneNumberId = config.whatsapp_business_phone_number_id;
    if (phoneNumberId) {
      // Phone number ID should be a numeric string
      if (/^\d+$/.test(phoneNumberId)) {
        console.log(`  ✓ Phone Number ID format is valid: ${phoneNumberId}`);
      } else {
        console.log(`  ✗ Phone Number ID format is invalid: ${phoneNumberId}`);
        console.log('  Expected: Numeric string (e.g., "123456789")');
      }
    } else {
      console.log('  ✗ Phone Number ID is not set');
    }

    // 3. Validate access token format
    console.log('\n3. 🔍 Validating access token format...');
    const accessToken = config.whatsapp_business_access_token;
    if (accessToken) {
      if (accessToken.startsWith('EAA')) {
        console.log('  ✓ Access token format appears valid (starts with EAA)');
      } else {
        console.log('  ✗ Access token format may be invalid');
        console.log('  Expected: Should start with "EAA"');
      }
    } else {
      console.log('  ✗ Access token is not set');
    }

    // 4. Test API endpoint construction
    console.log('\n4. 🔍 Testing API endpoint construction...');
    const apiVersion = config.whatsapp_business_api_version || 'v18.0';
    const formattedApiVersion = apiVersion.startsWith('v') ? apiVersion : `v${apiVersion}`;
    
    if (phoneNumberId) {
      const testUrl = `https://graph.facebook.com/${formattedApiVersion}/${phoneNumberId}`;
      console.log(`  Test URL: ${testUrl}`);
      
      // Check if the URL looks correct
      if (testUrl.includes('yes/')) {
        console.log('  ✗ URL contains "yes/" - this indicates a configuration issue');
        console.log('  The phone number ID may be incorrectly set to "yes"');
      } else {
        console.log('  ✓ URL format looks correct');
      }
    } else {
      console.log('  ✗ Cannot test URL - phone number ID not set');
    }

    // 5. Provide recommendations
    console.log('\n5. 💡 Recommendations:');
    
    if (!accessToken) {
      console.log('  • Set your WhatsApp Business API access token');
      console.log('  • Get it from your Meta Developer Console');
    }
    
    if (!phoneNumberId) {
      console.log('  • Set your WhatsApp Business phone number ID');
      console.log('  • Get it from your Meta Developer Console > WhatsApp > Phone Numbers');
    } else if (phoneNumberId === 'yes') {
      console.log('  • Your phone number ID is set to "yes" which is incorrect');
      console.log('  • Update it with the actual numeric phone number ID');
    }
    
    if (!config.whatsapp_business_enabled || config.whatsapp_business_enabled !== 'true') {
      console.log('  • Enable WhatsApp Business API in your settings');
    }

    // 6. Offer to fix common issues
    console.log('\n6. 🛠️  Quick fixes:');
    
    if (phoneNumberId === 'yes') {
      console.log('  • Run: node scripts/fix-whatsapp-phone-id.js');
    }
    
    if (!config.whatsapp_business_webhook_verify_token) {
      console.log('  • Run: node scripts/generate-webhook-token.js');
    }

    console.log('\n✅ Debug complete!\n');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug script
debugWhatsAppBusinessAPI();
