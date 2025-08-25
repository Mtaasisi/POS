#!/usr/bin/env node

/**
 * Fix WhatsApp Origin Issues
 * 
 * This script helps diagnose and fix origin mismatch issues with Green API
 */

const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function fixWhatsAppOriginIssues() {
  console.log('🔧 Fixing WhatsApp Origin Issues');
  console.log('================================\n');

  try {
    // 1. Check current instance status
    console.log('1️⃣ Checking current instance status...');
    const statusResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    
    if (!statusResponse.ok) {
      console.log(`❌ Status check failed: ${statusResponse.status}`);
      return;
    }
    
    const statusData = await statusResponse.json();
    console.log('✅ Instance Status:', statusData);
    
    // 2. Check webhook settings
    console.log('\n2️⃣ Checking webhook settings...');
    const webhookResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getWebhookSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
    
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Current Webhook Settings:', webhookData);
    } else {
      console.log('⚠️ Could not fetch webhook settings');
    }

    // 3. Check allowed numbers
    console.log('\n3️⃣ Checking allowed numbers...');
    const allowedResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getAllowedNumbers/${WHATSAPP_CREDENTIALS.apiToken}`);
    
    if (allowedResponse.ok) {
      const allowedData = await allowedResponse.json();
      console.log('✅ Allowed Numbers:', allowedData);
    } else {
      console.log('⚠️ Could not fetch allowed numbers');
    }

    // 4. Provide solutions
    console.log('\n=========================================');
    console.log('🔧 SOLUTIONS FOR ORIGIN ISSUES');
    console.log('=========================================');
    console.log('');
    console.log('📱 PostMessage Origin Mismatch Fix:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Use incognito/private browsing mode');
    console.log('3. Disable browser extensions temporarily');
    console.log('4. Try a different browser (Chrome, Firefox, Safari)');
    console.log('');
    console.log('🌐 Green API Console Access:');
    console.log('1. Go to: https://console.green-api.com');
    console.log('2. Sign in with your credentials');
    console.log('3. Navigate to your instance (ID: 7105284900)');
    console.log('4. Check webhook configuration');
    console.log('');
    console.log('📋 Rate Limiting Solutions:');
    console.log('1. ✅ Rate limiter updated (5-8 second intervals)');
    console.log('2. ✅ Status monitor created (30-second refresh)');
    console.log('3. ✅ Better error handling implemented');
    console.log('');
    console.log('🔗 Webhook Configuration:');
    console.log('If you need to set up webhook:');
    console.log('1. Deploy your webhook to Netlify');
    console.log('2. Get the webhook URL');
    console.log('3. Configure in Green API console');
    console.log('');
    console.log('📞 Test Message:');
    console.log('To test if everything is working:');
    console.log('node scripts/send-test-message.js');
    console.log('');
    console.log('🔍 Monitor Status:');
    console.log('Use the new WhatsAppStatusMonitor component');
    console.log('It has reduced polling frequency to prevent rate limiting');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }
}

// Run the fix
fixWhatsAppOriginIssues().catch(console.error);
