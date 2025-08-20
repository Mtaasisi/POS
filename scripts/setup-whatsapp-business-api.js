#!/usr/bin/env node

/**
 * WhatsApp Business API Setup Script
 * 
 * This script helps you set up WhatsApp Business API credentials
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

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

async function setupWhatsAppBusinessAPI() {
  console.log('\n🚀 WhatsApp Business API Setup\n');

  try {
    console.log('Please provide your WhatsApp Business API credentials:');
    console.log('(You can get these from https://developers.facebook.com/apps/)\n');

    const accessToken = await question('Access Token: ');
    const phoneNumberId = await question('Phone Number ID: ');
    const businessAccountId = await question('Business Account ID: ');
    const appId = await question('App ID: ');
    const appSecret = await question('App Secret: ');
    const apiVersion = await question('API Version (default: v19.0): ') || 'v19.0';

    // Generate a random webhook verify token
    const webhookVerifyToken = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);

    console.log('\n📋 Summary:');
    console.log(`Access Token: ${accessToken ? '✓ Set' : '✗ Not provided'}`);
    console.log(`Phone Number ID: ${phoneNumberId ? '✓ Set' : '✗ Not provided'}`);
    console.log(`Business Account ID: ${businessAccountId ? '✓ Set' : '✗ Not provided'}`);
    console.log(`App ID: ${appId ? '✓ Set' : '✗ Not provided'}`);
    console.log(`App Secret: ${appSecret ? '✓ Set' : '✗ Not provided'}`);
    console.log(`API Version: ${apiVersion}`);
    console.log(`Webhook Verify Token: ${webhookVerifyToken}`);

    const confirm = await question('\nSave these settings? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }

    // Save settings to database
    const settings = [
      { key: 'whatsapp_business_access_token', value: accessToken },
      { key: 'whatsapp_business_phone_number_id', value: phoneNumberId },
      { key: 'whatsapp_business_account_id', value: businessAccountId },
      { key: 'whatsapp_business_app_id', value: appId },
      { key: 'whatsapp_business_app_secret', value: appSecret },
      { key: 'whatsapp_business_webhook_verify_token', value: webhookVerifyToken },
      { key: 'whatsapp_business_api_version', value: apiVersion },
      { key: 'whatsapp_business_enabled', value: 'true' },
      { key: 'whatsapp_business_webhook_url', value: `${process.env.VITE_SITE_URL || 'http://localhost:3000'}/api/whatsapp-business-webhook` }
    ];

    const { error } = await supabase
      .from('settings')
      .upsert(settings, { onConflict: 'key' });

    if (error) {
      console.error('❌ Error saving settings:', error);
      rl.close();
      return;
    }

    console.log('\n✅ Settings saved successfully!');

    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Meta Developer Console');
    console.log('2. Navigate to your WhatsApp Business App');
    console.log('3. Go to Configuration > Webhooks');
    console.log('4. Add a webhook with the following details:');
    console.log(`   - Webhook URL: ${process.env.VITE_SITE_URL || 'http://localhost:3000'}/api/whatsapp-business-webhook`);
    console.log(`   - Verify Token: ${webhookVerifyToken}`);
    console.log('5. Subscribe to the following fields:');
    console.log('   - messages');
    console.log('   - message_status');
    console.log('   - message_template_status_update');
    console.log('6. Test the webhook verification');

    // Optional: Test connection
    const testConnection = await question('\nTest connection now? (y/N): ');
    
    if (testConnection.toLowerCase() === 'y') {
      console.log('\n🧪 Testing connection...');
      
      try {
        const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Connection successful!');
          console.log(`Phone Number: ${data.phone_number}`);
          console.log(`Verified Name: ${data.verified_name}`);
          console.log(`Quality Rating: ${data.quality_rating}`);
        } else {
          console.log('❌ Connection failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('❌ Connection test failed:', error.message);
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('You can now use WhatsApp Business API in your application.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
  }
}

// Run the setup
setupWhatsAppBusinessAPI().catch(console.error);
