#!/usr/bin/env node

/**
 * WhatsApp Business API Webhook Debugging Script
 * 
 * This script helps debug webhook verification issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugWebhook() {
  console.log('\n🔍 WhatsApp Business API Webhook Debugging\n');

  try {
    // 1. Check if webhook settings exist
    console.log('1. Checking webhook settings...');
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'whatsapp_business_webhook_verify_token',
        'whatsapp_business_access_token',
        'whatsapp_business_phone_number_id'
      ]);

    if (error) {
      console.error('❌ Error fetching settings:', error);
      return;
    }

    const webhookToken = settings.find(s => s.key === 'whatsapp_business_webhook_verify_token')?.value;
    const accessToken = settings.find(s => s.key === 'whatsapp_business_access_token')?.value;
    const phoneNumberId = settings.find(s => s.key === 'whatsapp_business_phone_number_id')?.value;

    console.log('📋 Current Settings:');
    console.log(`   Webhook Verify Token: ${webhookToken ? '✓ Set' : '✗ Not set'}`);
    console.log(`   Access Token: ${accessToken ? '✓ Set' : '✗ Not set'}`);
    console.log(`   Phone Number ID: ${phoneNumberId ? '✓ Set' : '✗ Not set'}`);

    if (!webhookToken) {
      console.log('\n❌ Webhook verify token is not set!');
      console.log('   Please go to Settings > WhatsApp and generate a webhook token.');
      return;
    }

    // 2. Test webhook URL accessibility
    console.log('\n2. Testing webhook URL accessibility...');
    const webhookUrl = `${process.env.VITE_SITE_URL || 'http://localhost:3001'}/api/whatsapp-business-webhook`;
    console.log(`   Webhook URL: ${webhookUrl}`);

    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response OK: ${response.ok ? '✓' : '✗'}`);

      if (response.status === 400) {
        console.log('   ✓ Webhook endpoint is accessible (400 is expected for GET without parameters)');
      } else if (response.ok) {
        console.log('   ✓ Webhook endpoint is accessible');
      } else {
        console.log('   ✗ Webhook endpoint is not accessible');
        console.log('   Please check your server configuration and make sure the endpoint is deployed.');
      }
    } catch (error) {
      console.log('   ✗ Cannot access webhook endpoint:', error.message);
      console.log('   Please check your server configuration and make sure the endpoint is deployed.');
    }

    // 3. Generate test verification request
    console.log('\n3. Testing webhook verification...');
    const testMode = 'subscribe';
    const testChallenge = 'test_challenge_123';
    const testUrl = `${webhookUrl}?hub.mode=${testMode}&hub.verify_token=${webhookToken}&hub.challenge=${testChallenge}`;

    console.log(`   Test URL: ${testUrl}`);

    try {
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Test Response Status: ${testResponse.status}`);
      
      if (testResponse.ok) {
        const responseText = await testResponse.text();
        console.log(`   Test Response Body: ${responseText}`);
        
        if (responseText === testChallenge) {
          console.log('   ✓ Webhook verification is working correctly!');
        } else {
          console.log('   ✗ Webhook verification failed - challenge not returned');
        }
      } else {
        console.log('   ✗ Webhook verification failed - HTTP error');
        const errorText = await testResponse.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log('   ✗ Cannot test webhook verification:', error.message);
    }

    // 4. Check Meta Developer Console requirements
    console.log('\n4. Meta Developer Console Checklist:');
    console.log('   Please verify the following in your Meta Developer Console:');
    console.log('   ✓ Webhook URL is correct and accessible');
    console.log('   ✓ Verify Token matches the one in your settings');
    console.log('   ✓ Webhook fields are subscribed: messages, message_status');
    console.log('   ✓ Your app is in development mode or approved');
    console.log('   ✓ Your phone number is verified');

    // 5. Common solutions
    console.log('\n5. Common Solutions:');
    console.log('   If verification is failing:');
    console.log('   1. Make sure your webhook URL is publicly accessible');
    console.log('   2. Verify the token matches exactly (case-sensitive)');
    console.log('   3. Check that your server can handle GET requests');
    console.log('   4. Ensure your app is properly configured in Meta Console');
    console.log('   5. Try regenerating the webhook token');

    // 6. Generate new token if needed
    console.log('\n6. Generate new webhook token:');
    const newToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
    console.log(`   New token: ${newToken}`);
    console.log('   To use this token:');
    console.log('   1. Go to Settings > WhatsApp');
    console.log('   2. Click "Generate" next to Webhook Verify Token');
    console.log('   3. Update the token in Meta Developer Console');
    console.log('   4. Try the verification again');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug script
debugWebhook().catch(console.error);
