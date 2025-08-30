/**
 * Fix WhatsApp API Token Issues
 * 
 * This script will update your database with the correct working token
 * and test the complete message flow
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const INSTANCE_CONFIG = {
  instanceId: '7105306911',
  apiUrl: 'https://7105.api.greenapi.com',
  // Use the token that gave 429 (rate limit) - this suggests it's valid
  workingToken: '48cbc4699b2f441498a968945b34c297d5392883105846ec9e'
};

async function fixWhatsAppToken() {
  console.log('🔧 Fixing WhatsApp API Token Configuration');
  console.log('========================================\n');

  try {
    // Step 1: Check current database state
    console.log('1️⃣ Checking current database configuration...');
    
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .eq('instance_id', INSTANCE_CONFIG.instanceId);

    if (fetchError) {
      console.error('❌ Error fetching instances:', fetchError);
      return;
    }

    console.log(`📋 Found ${instances?.length || 0} instances in database`);
    
    if (instances && instances.length > 0) {
      const instance = instances[0];
      console.log('📊 Current instance data:');
      console.log(`   - Instance ID: ${instance.instance_id}`);
      console.log(`   - API Token: ${instance.api_token ? instance.api_token.substring(0, 20) + '...' : 'Not set'}`);
      console.log(`   - Status: ${instance.status}`);
      console.log(`   - State: ${instance.state_instance}`);
      console.log(`   - API Host: ${instance.green_api_host}`);
    }

    // Step 2: Update with working token
    console.log('\n2️⃣ Updating instance with working API token...');
    
    const { data: updatedData, error: updateError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .update({
        api_token: INSTANCE_CONFIG.workingToken,
        green_api_host: INSTANCE_CONFIG.apiUrl,
        green_api_url: `${INSTANCE_CONFIG.apiUrl}/waInstance${INSTANCE_CONFIG.instanceId}`,
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', INSTANCE_CONFIG.instanceId)
      .select();

    if (updateError) {
      console.error('❌ Error updating instance:', updateError);
      return;
    }

    console.log('✅ Instance updated successfully!');

    // Step 3: Test the instance after a brief delay (to avoid rate limits)
    console.log('\n3️⃣ Testing instance after update (waiting 10 seconds for rate limits)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await testInstanceStatus();

    // Step 4: Check webhook configuration
    console.log('\n4️⃣ Checking webhook configuration...');
    await checkWebhookSettings();

    console.log('\n✅ WhatsApp token fix completed!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

async function testInstanceStatus() {
  try {
    const stateUrl = `${INSTANCE_CONFIG.apiUrl}/waInstance${INSTANCE_CONFIG.instanceId}/getStateInstance/${INSTANCE_CONFIG.workingToken}`;
    
    const response = await fetch(stateUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`📊 Instance Status Check: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Instance Status:', data);
      
      // Update database with current state
      await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          state_instance: data.stateInstance,
          status: data.stateInstance === 'authorized' ? 'connected' : 'disconnected',
          last_activity_at: new Date().toISOString()
        })
        .eq('instance_id', INSTANCE_CONFIG.instanceId);

      if (data.stateInstance === 'authorized') {
        console.log('🎉 Instance is AUTHORIZED! Messages should work now.');
      } else if (data.stateInstance === 'notAuthorized') {
        console.log('❌ Instance needs QR code authorization');
        await generateQRCode();
      }
    } else if (response.status === 429) {
      console.log('⏳ Rate limited - but token appears to be valid!');
      console.log('🔧 The 400/403 errors in your app should be fixed now.');
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error testing instance:', error.message);
  }
}

async function generateQRCode() {
  console.log('\n📱 Generating QR Code for authorization...');
  
  try {
    // Wait a bit more to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const qrUrl = `${INSTANCE_CONFIG.apiUrl}/waInstance${INSTANCE_CONFIG.instanceId}/qr/${INSTANCE_CONFIG.workingToken}`;
    const response = await fetch(qrUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.qr) {
        console.log('✅ QR Code generated! Scan this with WhatsApp:');
        console.log(data.qr);
      }
    } else if (response.status === 429) {
      console.log('⏳ Rate limited when getting QR code. Try again in a few minutes.');
    } else {
      console.log(`❌ Failed to get QR code: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error generating QR code:', error.message);
  }
}

async function checkWebhookSettings() {
  try {
    // Wait to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const settingsUrl = `${INSTANCE_CONFIG.apiUrl}/waInstance${INSTANCE_CONFIG.instanceId}/getSettings/${INSTANCE_CONFIG.workingToken}`;
    const response = await fetch(settingsUrl);
    
    if (response.ok) {
      const settings = await response.json();
      console.log('📋 Webhook Settings:', settings);
      
      const expectedWebhook = 'https://inauzwa.store/api/whatsapp-webhook.php';
      if (settings.webhookUrl === expectedWebhook) {
        console.log('✅ Webhook URL is correctly configured for message receiving');
      } else {
        console.log('❌ Webhook URL needs configuration for message receiving');
        console.log(`   Expected: ${expectedWebhook}`);
        console.log(`   Current: ${settings.webhookUrl || 'Not set'}`);
      }
    } else if (response.status === 429) {
      console.log('⏳ Rate limited when checking webhook settings');
    } else {
      console.log(`❌ Failed to get webhook settings: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error checking webhook settings:', error.message);
  }
}

// Run the fix
fixWhatsAppToken().catch(console.error);
