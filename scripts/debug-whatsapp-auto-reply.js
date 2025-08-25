/**
 * WhatsApp Auto-Reply Debug Script
 * 
 * This script helps diagnose why auto-replies are not working in production
 * Run this to check all components of the WhatsApp auto-reply system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWhatsAppAutoReply() {
  console.log('🔍 ===== WHATSAPP AUTO-REPLY DEBUG =====\n');
  
  try {
    // 1. Check database settings
    console.log('📋 1. Checking database settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'whatsapp.instanceId',
        'whatsapp.apiToken',
        'whatsapp.apiUrl',
        'whatsapp.mediaUrl'
      ]);

    if (settingsError) {
      console.error('❌ Database error:', settingsError.message);
      return;
    }

    const settings = {};
    (settingsData || []).forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });

    console.log('📊 Database Settings:');
    console.log(`   Instance ID: ${settings['whatsapp.instanceId'] || 'NOT SET'}`);
    console.log(`   API URL: ${settings['whatsapp.apiUrl'] || 'NOT SET'}`);
    console.log(`   API Token: ${settings['whatsapp.apiToken'] ? `${settings['whatsapp.apiToken'].substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   Media URL: ${settings['whatsapp.mediaUrl'] || 'NOT SET'}`);

    // 2. Check auto-reply rules
    console.log('\n📋 2. Checking auto-reply rules...');
    const { data: rulesData, error: rulesError } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (rulesError) {
      console.error('❌ Error fetching auto-reply rules:', rulesError.message);
      console.log('💡 This might be normal if the table doesn\'t exist yet');
    } else {
      console.log(`📊 Found ${rulesData?.length || 0} enabled auto-reply rules:`);
      (rulesData || []).forEach((rule, index) => {
        console.log(`   ${index + 1}. Trigger: "${rule.trigger}" → Response: "${rule.response}"`);
      });
    }

    // 3. Test WhatsApp proxy endpoint
    console.log('\n📋 3. Testing WhatsApp proxy endpoint...');
    try {
      const proxyResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health' })
      });

      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        console.log('✅ WhatsApp proxy is working');
        console.log(`   Status: ${proxyData.status}`);
        console.log(`   Environment: ${proxyData.environment}`);
        console.log(`   Credentials configured: ${proxyData.credentials_configured}`);
      } else {
        console.error(`❌ WhatsApp proxy failed: ${proxyResponse.status}`);
      }
    } catch (error) {
      console.error('❌ WhatsApp proxy error:', error.message);
    }

    // 4. Test webhook endpoint
    console.log('\n📋 4. Testing webhook endpoint...');
    try {
      const webhookResponse = await fetch('https://inauzwa.store/api/whatsapp-webhook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeWebhook: 'incomingMessageReceived',
          body: {
            idMessage: 'test123',
            messageData: {
              textMessageData: {
                textMessage: 'Hi'
              }
            },
            senderData: {
              chatId: '254700000000@c.us'
            }
          }
        })
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('✅ Webhook endpoint is working');
        console.log(`   Response: ${JSON.stringify(webhookData)}`);
      } else {
        console.error(`❌ Webhook endpoint failed: ${webhookResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Webhook endpoint error:', error.message);
    }

    // 5. Check WhatsApp instance state
    console.log('\n📋 5. Checking WhatsApp instance state...');
    if (settings['whatsapp.instanceId'] && settings['whatsapp.apiToken']) {
      try {
        const stateResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getStateInstance' })
        });

        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          console.log('✅ WhatsApp instance state retrieved');
          console.log(`   State: ${stateData.stateInstance || 'unknown'}`);
          console.log(`   Authorized: ${stateData.stateInstance === 'authorized' ? 'YES' : 'NO'}`);
        } else {
          console.error(`❌ Failed to get instance state: ${stateResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Instance state error:', error.message);
      }
    } else {
      console.log('⚠️  Cannot check instance state - credentials not configured');
    }

    // 6. Check webhook settings
    console.log('\n📋 6. Checking webhook settings...');
    if (settings['whatsapp.instanceId'] && settings['whatsapp.apiToken']) {
      try {
        const webhookSettingsResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getWebhookSettings' })
        });

        if (webhookSettingsResponse.ok) {
          const webhookSettingsData = await webhookSettingsResponse.json();
          console.log('✅ Webhook settings retrieved');
          console.log(`   Webhook URL: ${webhookSettingsData.webhookUrl || 'NOT SET'}`);
          console.log(`   Incoming Webhook: ${webhookSettingsData.incomingWebhook || 'NOT SET'}`);
          console.log(`   Outgoing Webhook: ${webhookSettingsData.outgoingWebhook || 'NOT SET'}`);
        } else {
          console.error(`❌ Failed to get webhook settings: ${webhookSettingsResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Webhook settings error:', error.message);
      }
    } else {
      console.log('⚠️  Cannot check webhook settings - credentials not configured');
    }

    // 7. Summary and recommendations
    console.log('\n📋 7. Summary and Recommendations:');
    
    const issues = [];
    
    if (!settings['whatsapp.instanceId'] || !settings['whatsapp.apiToken']) {
      issues.push('❌ WhatsApp credentials not configured in database');
    }
    
    if (!rulesData || rulesData.length === 0) {
      issues.push('❌ No auto-reply rules configured');
    }
    
    if (issues.length === 0) {
      console.log('✅ All components appear to be configured correctly');
      console.log('💡 If auto-replies still don\'t work, check:');
      console.log('   1. Green API dashboard webhook configuration');
      console.log('   2. Server logs at /api/webhook_log.txt');
      console.log('   3. WhatsApp instance authorization status');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

// Run the debug script
debugWhatsAppAutoReply().then(() => {
  console.log('\n🔍 ===== DEBUG COMPLETE =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
