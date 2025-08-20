#!/usr/bin/env node

/**
 * Get Webhook Token Script
 * 
 * This script retrieves the exact webhook token from the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getWebhookToken() {
  console.log('\n🔍 Getting Webhook Token from Database\n');

  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'whatsapp_business_webhook_verify_token')
      .single();

    if (error) {
      console.error('❌ Error fetching webhook token:', error);
      return;
    }

    const token = settings?.value;
    
    if (!token) {
      console.log('❌ No webhook token found in database');
      console.log('Please run the setup script first: node scripts/setup-whatsapp-business-api.js');
      return;
    }

    console.log('✅ Webhook Token Found:');
    console.log(`   Token: ${token}`);
    console.log(`   Length: ${token.length} characters`);
    
    console.log('\n📋 Use this exact token in Meta Developer Console:');
    console.log(`   ${token}`);
    
    console.log('\n🎯 Steps to fix the verification error:');
    console.log('1. Go to Meta Developer Console');
    console.log('2. Navigate to your WhatsApp Business App');
    console.log('3. Go to Configuration > Webhooks');
    console.log('4. Set the webhook URL to: https://webhook.site/your-unique-url');
    console.log('5. Set the verify token to the exact token above');
    console.log('6. Make sure to copy the token exactly (case-sensitive)');
    console.log('7. Click "Verify and Save"');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
getWebhookToken().catch(console.error);
