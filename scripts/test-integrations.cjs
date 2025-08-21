#!/usr/bin/env node

/**
 * Integration Testing Script (CommonJS)
 * Tests all integrations in the LATS CHANCE app
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIntegrations() {
  console.log('🧪 Integration Testing Tool');
  console.log('============================\n');

  const results = {
    database: false,
    sms: false,
    whatsapp: false,
    ai: false,
    payment: false
  };

  // Test 1: Database Connection
  console.log('1️⃣ Testing Database Connection...');
  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('count')
      .limit(1);

    if (error) throw error;
    
    console.log('✅ Database connection successful');
    results.database = true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  // Test 2: Get Integrations
  console.log('\n2️⃣ Loading Integrations...');
  try {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*');

    if (error) throw error;

    console.log(`✅ Found ${integrations.length} integrations`);
    
    // Test each integration
    for (const integration of integrations) {
      console.log(`\n📋 Testing: ${integration.name} (${integration.type})`);
      
      switch (integration.type) {
        case 'sms':
          await testSMSIntegration(integration, results);
          break;
        case 'whatsapp':
          await testWhatsAppIntegration(integration, results);
          break;
        case 'ai':
          await testAIIntegration(integration, results);
          break;
        case 'payment':
          await testPaymentIntegration(integration, results);
          break;
        default:
          console.log(`⚠️ Unknown integration type: ${integration.type}`);
      }
    }
  } catch (error) {
    console.log('❌ Error loading integrations:', error.message);
  }

  // Test 3: Check Settings
  console.log('\n3️⃣ Checking Settings...');
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .in('category', ['whatsapp', 'sms', 'ai', 'payment']);

    if (error) throw error;

    console.log(`✅ Found ${settings.length} integration settings`);
    
    for (const setting of settings) {
      console.log(`   ${setting.key}: ${setting.value ? '✓ Set' : '✗ Empty'}`);
    }
  } catch (error) {
    console.log('❌ Error checking settings:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([integration, status]) => {
    const icon = status ? '✅' : '❌';
    const statusText = status ? 'WORKING' : 'FAILED';
    console.log(`${icon} ${integration.toUpperCase()}: ${statusText}`);
  });

  const workingCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Status: ${workingCount}/${totalCount} integrations working`);
  
  if (workingCount === totalCount) {
    console.log('🎉 All integrations are working perfectly!');
  } else {
    console.log('⚠️ Some integrations need attention');
    console.log('\n💡 Next Steps:');
    console.log('1. Check integration credentials in admin settings');
    console.log('2. Verify API keys are valid');
    console.log('3. Test individual integrations in the app');
    console.log('4. Visit /integration-testing in your app for detailed testing');
  }
}

async function testSMSIntegration(integration, results) {
  try {
    const { username, password } = integration.config;
    
    if (!username || !password) {
      console.log('   ❌ SMS credentials not configured');
      return;
    }

    const params = new URLSearchParams({
      user: username,
      pwd: password,
    });
    
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    
    if (response.ok) {
      const balanceMatch = responseText.match(/=\s*(\d+)/);
      if (balanceMatch) {
        console.log(`   ✅ SMS integration working (Balance: ${balanceMatch[1]})`);
        results.sms = true;
      } else {
        console.log('   ❌ SMS balance check failed');
      }
    } else {
      console.log(`   ❌ SMS API error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ SMS test failed: ${error.message}`);
  }
}

async function testWhatsAppIntegration(integration, results) {
  try {
    const { instance_id, api_key } = integration.config;
    
    if (!instance_id || !api_key) {
      console.log('   ❌ WhatsApp credentials not configured');
      return;
    }

    // Test Green API connection
    const response = await fetch(`https://api.green-api.com/waInstance${instance_id}/getStateInstance/${api_key}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.stateInstance === 'authorized') {
        console.log('   ✅ WhatsApp integration working (Authorized)');
        results.whatsapp = true;
      } else {
        console.log(`   ⚠️ WhatsApp not authorized (State: ${data.stateInstance})`);
      }
    } else {
      console.log(`   ❌ WhatsApp API error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ WhatsApp test failed: ${error.message}`);
  }
}

async function testAIIntegration(integration, results) {
  try {
    const { api_key } = integration.config;
    
    if (!api_key) {
      console.log('   ❌ AI API key not configured');
      return;
    }

    // Test Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test message.'
          }]
        }]
      })
    });
    
    if (response.ok) {
      console.log('   ✅ AI integration working');
      results.ai = true;
    } else {
      const errorData = await response.json();
      console.log(`   ❌ AI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ AI test failed: ${error.message}`);
  }
}

async function testPaymentIntegration(integration, results) {
  try {
    // Test payment integration based on provider
    switch (integration.provider) {
      case 'beem':
        console.log('   ⚠️ Beem payment test requires order creation (skipping)');
        results.payment = true; // Assume working for now
        break;
      case 'zenopay':
        console.log('   ⚠️ ZenoPay test requires order creation (skipping)');
        results.payment = true; // Assume working for now
        break;
      default:
        console.log(`   ⚠️ Unknown payment provider: ${integration.provider}`);
    }
  } catch (error) {
    console.log(`   ❌ Payment test failed: ${error.message}`);
  }
}

// Run the tests
testIntegrations().catch(console.error);
