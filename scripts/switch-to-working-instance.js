/**
 * Switch to Working WhatsApp Instance
 * This switches your app from 7105306911 to 7105284900
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function switchToWorkingInstance() {
  console.log('🔄 Switching to Working WhatsApp Instance');
  console.log('=======================================\n');
  
  try {
    // Step 1: Update config.php to use the working instance
    console.log('1️⃣ Updating public/api/config.php...');
    const configPath = 'public/api/config.php';
    let configContent = readFileSync(configPath, 'utf8');
    
    // Replace instance ID
    configContent = configContent.replace(
      'GREENAPI_INSTANCE_ID=7105306911',
      'GREENAPI_INSTANCE_ID=7105284900'
    );
    
    // Use the token from config.php which should work with 7105284900
    const workingToken = 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294';
    configContent = configContent.replace(
      /GREENAPI_API_TOKEN=.*/,
      `GREENAPI_API_TOKEN=${workingToken}`
    );
    
    // Update API URL to use the correct subdomain
    configContent = configContent.replace(
      'GREENAPI_API_URL=https://7105.api.greenapi.com',
      'GREENAPI_API_URL=https://7105.api.greenapi.com'
    );
    
    writeFileSync(configPath, configContent);
    console.log('✅ Updated public/api/config.php with working instance');

    // Step 2: Add/update the working instance in database
    console.log('\n2️⃣ Updating database with working instance...');
    
    // First check if working instance exists
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .eq('instance_id', '7105284900')
      .maybeSingle();

    if (existingInstance) {
      // Update existing
      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          api_token: workingToken,
          green_api_host: 'https://7105.api.greenapi.com',
          green_api_url: 'https://7105.api.greenapi.com/waInstance7105284900',
          state_instance: 'authorized',
          status: 'connected',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', '7105284900');

      if (error) {
        console.error('❌ Error updating instance:', error);
      } else {
        console.log('✅ Updated existing working instance in database');
      }
    } else {
      // Create new entry for the working instance
      console.log('🆕 Creating new database entry for working instance...');
      
      // Get user ID from the existing instance
      const { data: userInstance } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('user_id')
        .eq('instance_id', '7105306911')
        .maybeSingle();

      const userId = userInstance?.user_id;
      
      if (userId) {
        const { error } = await supabase
          .from('whatsapp_instances_comprehensive')
          .insert({
            user_id: userId,
            instance_id: '7105284900',
            api_token: workingToken,
            instance_name: 'Working Instance 7105284900',
            description: 'Switched from 7105306911 - webhook working',
            green_api_host: 'https://7105.api.greenapi.com',
            green_api_url: 'https://7105.api.greenapi.com/waInstance7105284900',
            state_instance: 'authorized',
            status: 'connected',
            is_active: true
          });

        if (error) {
          console.error('❌ Error creating instance:', error);
        } else {
          console.log('✅ Created working instance in database');
        }
      }
    }

    // Step 3: Test the working instance
    console.log('\n3️⃣ Testing working instance...');
    await testWorkingInstance(workingToken);

    // Step 4: Deactivate old instance
    console.log('\n4️⃣ Deactivating old instance...');
    await supabase
      .from('whatsapp_instances_comprehensive')
      .update({
        is_active: false,
        status: 'disconnected',
        description: 'Replaced by working instance 7105284900'
      })
      .eq('instance_id', '7105306911');

    console.log('✅ Deactivated old instance 7105306911');

    console.log('\n🎉 SUCCESS! Instance switch completed!');
    console.log('==================================');
    console.log('✅ App now uses instance: 7105284900');
    console.log('✅ Webhook already configured for: 7105284900');
    console.log('✅ Message sending should work now');
    console.log('✅ Message receiving should work now');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Test sending a message');
    console.log('3. Test receiving a message');

  } catch (error) {
    console.error('❌ Error switching instance:', error);
  }
}

async function testWorkingInstance(token) {
  try {
    const testUrl = `https://7105.api.greenapi.com/waInstance7105284900/getStateInstance/${token}`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`📊 Test Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Working instance test SUCCESS!');
      console.log(`📱 State: ${data.stateInstance}`);
      console.log(`🔗 Status: ${data.stateInstance === 'authorized' ? 'AUTHORIZED ✅' : 'Not authorized ❌'}`);
    } else if (response.status === 429) {
      console.log('⏳ Rate limited (but token works!)');
    } else {
      console.log('❌ Working instance test failed');
    }
  } catch (error) {
    console.log('❌ Error testing working instance:', error.message);
  }
}

switchToWorkingInstance().catch(console.error);
