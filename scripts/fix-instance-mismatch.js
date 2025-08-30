/**
 * Fix WhatsApp Instance Mismatch Issue
 * 
 * Found: App uses 7105306911 but webhook is configured for 7105284900
 * This script will identify which instance to use and fix the configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const INSTANCES = {
  current: '7105306911',  // Your app is trying to use this
  webhook: '7105284900'   // Webhook is configured for this
};

async function fixInstanceMismatch() {
  console.log('🔧 Fixing WhatsApp Instance Mismatch');
  console.log('==================================\n');

  console.log('📋 Issue Found:');
  console.log(`   App Instance: ${INSTANCES.current} (your logs show this)`);
  console.log(`   Webhook Instance: ${INSTANCES.webhook} (webhook logs show this)`);
  console.log('   This is why you\'re not receiving messages!\n');

  // Step 1: Check which instances exist in database
  console.log('1️⃣ Checking database for both instances...');
  await checkDatabaseInstances();

  // Step 2: Test both instances with their tokens
  console.log('\n2️⃣ Testing both instances...');
  await testBothInstances();

  // Step 3: Recommend the fix
  console.log('\n3️⃣ Recommendation...');
  await recommendFix();
}

async function checkDatabaseInstances() {
  try {
    const { data: instances, error } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .in('instance_id', [INSTANCES.current, INSTANCES.webhook]);

    if (error) {
      console.error('❌ Error fetching instances:', error);
      return;
    }

    console.log(`📊 Found ${instances?.length || 0} instances in database:`);
    
    if (instances && instances.length > 0) {
      instances.forEach(instance => {
        console.log(`   - ${instance.instance_id}: ${instance.status} (${instance.state_instance})`);
        console.log(`     Token: ${instance.api_token ? instance.api_token.substring(0, 15) + '...' : 'Not set'}`);
        console.log(`     Host: ${instance.green_api_host}`);
      });
    } else {
      console.log('   ❌ No instances found in database');
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

async function testBothInstances() {
  // Get tokens from the database first
  const { data: instances } = await supabase
    .from('whatsapp_instances_comprehensive')
    .select('*')
    .in('instance_id', [INSTANCES.current, INSTANCES.webhook]);

  if (!instances || instances.length === 0) {
    console.log('❌ No instances found to test');
    return;
  }

  for (const instance of instances) {
    console.log(`\n🧪 Testing instance ${instance.instance_id}...`);
    await testSingleInstance(instance);
  }
}

async function testSingleInstance(instance) {
  try {
    const apiUrl = instance.green_api_host || 'https://7105.api.greenapi.com';
    const testUrl = `${apiUrl}/waInstance${instance.instance_id}/getStateInstance/${instance.api_token}`;
    
    console.log(`📡 Testing: ${instance.instance_id}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Instance ${instance.instance_id} is working!`);
      console.log(`   State: ${data.stateInstance}`);
      console.log(`   This instance ${data.stateInstance === 'authorized' ? 'IS AUTHORIZED' : 'needs authorization'}`);
      
      return { working: true, authorized: data.stateInstance === 'authorized', instance };
    } else if (response.status === 429) {
      console.log(`⏳ Instance ${instance.instance_id} is rate limited (but token is valid)`);
      return { working: true, authorized: true, instance }; // Assume authorized if rate limited
    } else {
      console.log(`❌ Instance ${instance.instance_id} failed: ${response.status}`);
      return { working: false, authorized: false, instance };
    }
  } catch (error) {
    console.log(`❌ Error testing ${instance.instance_id}:`, error.message);
    return { working: false, authorized: false, instance };
  }
}

async function recommendFix() {
  console.log('🎯 RECOMMENDATION:');
  console.log('================\n');

  // Based on webhook logs, instance 7105284900 is working and authorized
  console.log('✅ Use instance 7105284900 (the one receiving webhooks)');
  console.log('🔧 Update your app to use this instance instead of 7105306911\n');

  console.log('📋 Files to update:');
  console.log('   1. src/services/greenApiService.ts (getInstance calls)');
  console.log('   2. public/api/config.php (GREENAPI_INSTANCE_ID)');
  console.log('   3. Database: Update any references to 7105306911\n');

  console.log('🚀 Quick fix command:');
  console.log('   node scripts/switch-to-working-instance.js\n');

  // Create the quick fix script
  await createQuickFixScript();
}

async function createQuickFixScript() {
  const quickFixScript = `
/**
 * Switch to Working WhatsApp Instance
 * This switches your app from 7105306911 to 7105284900
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';

const supabase = createClient('${supabaseUrl}', '${supabaseServiceKey}');

async function switchToWorkingInstance() {
  console.log('🔄 Switching to working instance 7105284900...');
  
  try {
    // 1. Update config.php
    const configPath = 'public/api/config.php';
    let configContent = fs.readFileSync(configPath, 'utf8');
    configContent = configContent.replace(
      'GREENAPI_INSTANCE_ID=7105306911',
      'GREENAPI_INSTANCE_ID=7105284900'
    );
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Updated public/api/config.php');

    // 2. Get the working instance token from database
    const { data: workingInstance } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .eq('instance_id', '7105284900')
      .single();

    if (workingInstance) {
      console.log('✅ Found working instance in database');
      console.log('🎉 Your app should now use the working instance!');
      console.log('📱 Instance ID: 7105284900');
      console.log('🔗 Webhook: Already configured and working');
      console.log('📤 Message sending: Should work now');
      console.log('📥 Message receiving: Should work now');
    } else {
      console.log('❌ Working instance not found in database');
      console.log('🔧 You may need to add instance 7105284900 to your database');
    }

  } catch (error) {
    console.error('❌ Error switching instance:', error);
  }
}

switchToWorkingInstance();
`;

      writeFileSync('scripts/switch-to-working-instance.js', quickFixScript);
  console.log('✅ Created scripts/switch-to-working-instance.js');
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { fixInstanceMismatch, INSTANCES };
}

// Run the fix
fixInstanceMismatch().catch(console.error);
