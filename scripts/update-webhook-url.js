#!/usr/bin/env node

/**
 * Update Webhook URL Script
 * 
 * This script updates the webhook URL in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function updateWebhookUrl() {
  console.log('\n🔧 Updating Webhook URL\n');

  try {
    const webhookUrl = 'http://localhost:3001/api/whatsapp-business-webhook';
    
    console.log(`Setting webhook URL to: ${webhookUrl}`);

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'whatsapp_business_webhook_url',
        value: webhookUrl
      }, { onConflict: 'key' });

    if (error) {
      console.error('❌ Error updating webhook URL:', error);
      return;
    }

    console.log('✅ Webhook URL updated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Meta Developer Console');
    console.log('2. Navigate to your WhatsApp Business App');
    console.log('3. Go to Configuration > Webhooks');
    console.log('4. Update the webhook URL to:');
    console.log(`   ${webhookUrl}`);
    console.log('5. Use the verify token: ng99c6yzbmuqru72q9bp');
    console.log('6. Test the webhook verification');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
updateWebhookUrl().catch(console.error);
