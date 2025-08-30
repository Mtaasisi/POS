import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   • VITE_SUPABASE_URL');
  console.error('   • SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Checking and Fixing WhatsApp Instances');
console.log('=========================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixInstances() {
  try {
    console.log('📋 Checking instances in whatsapp_instances...');
    
    const { data: oldInstances, error: oldError } = await supabase
      .from('whatsapp_instances')
      .select('*');
    
    if (oldError) {
      console.log('⚠️ Could not fetch from whatsapp_instances:', oldError.message);
    } else {
      console.log(`Found ${oldInstances?.length || 0} instances in whatsapp_instances table`);
      if (oldInstances && oldInstances.length > 0) {
        console.log('Instances in whatsapp_instances:');
        oldInstances.forEach(instance => {
          console.log(`  - ID: ${instance.instance_id}, Phone: ${instance.phone_number}, Status: ${instance.status}`);
        });
      }
    }
    
    console.log('\n📋 Checking instances in whatsapp_instances_comprehensive...');
    
    const { data: newInstances, error: newError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*');
    
    if (newError) {
      console.log('⚠️ Could not fetch from whatsapp_instances_comprehensive:', newError.message);
    } else {
      console.log(`Found ${newInstances?.length || 0} instances in whatsapp_instances_comprehensive table`);
      if (newInstances && newInstances.length > 0) {
        console.log('Instances in whatsapp_instances_comprehensive:');
        newInstances.forEach(instance => {
          console.log(`  - ID: ${instance.instance_id}, Phone: ${instance.phone_number}, Status: ${instance.status}`);
        });
      }
    }
    
    console.log('\n📋 Checking instances in integrations table...');
    
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'whatsapp')
      .eq('provider', 'green-api');
    
    if (integrationsError) {
      console.log('⚠️ Could not fetch from integrations:', integrationsError.message);
    } else {
      console.log(`Found ${integrations?.length || 0} WhatsApp integrations`);
      if (integrations && integrations.length > 0) {
        console.log('WhatsApp integrations:');
        integrations.forEach(integration => {
          console.log(`  - ID: ${integration.config?.instance_id}, Status: ${integration.config?.status}`);
        });
      }
    }
    
    // If we have instances in the old table but not in the new table, migrate them
    if (oldInstances && oldInstances.length > 0 && (!newInstances || newInstances.length === 0)) {
      console.log('\n📋 Migrating instances from whatsapp_instances to whatsapp_instances_comprehensive...');
      
      for (const instance of oldInstances) {
        console.log(`Migrating instance: ${instance.instance_id}`);
        
        const { error: insertError } = await supabase
          .from('whatsapp_instances_comprehensive')
          .upsert({
            instance_id: instance.instance_id,
            api_token: instance.api_token,
            phone_number: instance.phone_number,
            status: instance.status,
            created_at: instance.created_at,
            updated_at: instance.updated_at,
            is_active: true
          }, {
            onConflict: 'instance_id'
          });
        
        if (insertError) {
          console.error(`❌ Error migrating instance ${instance.instance_id}:`, insertError);
        } else {
          console.log(`✅ Migrated instance ${instance.instance_id}`);
        }
      }
    }
    
    // If we have integrations but no instances in either table, create them
    if (integrations && integrations.length > 0 && (!newInstances || newInstances.length === 0) && (!oldInstances || oldInstances.length === 0)) {
      console.log('\n📋 Creating instances from integrations...');
      
      for (const integration of integrations) {
        const instanceId = integration.config?.instance_id;
        if (instanceId) {
          console.log(`Creating instance from integration: ${instanceId}`);
          
          const { error: insertError } = await supabase
            .from('whatsapp_instances_comprehensive')
            .upsert({
              instance_id: instanceId,
              api_token: integration.config?.api_key || '',
              phone_number: instanceId,
              status: integration.config?.status || 'disconnected',
              green_api_host: integration.config?.api_url || 'https://api.green-api.com',
              is_active: true,
              created_at: integration.created_at,
              updated_at: integration.updated_at
            }, {
              onConflict: 'instance_id'
            });
          
          if (insertError) {
            console.error(`❌ Error creating instance ${instanceId}:`, insertError);
          } else {
            console.log(`✅ Created instance ${instanceId}`);
          }
        }
      }
    }
    
    // Test message insertion after fix
    console.log('\n🧪 Testing message insertion...');
    
    const { data: testInstances, error: testError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('instance_id')
      .limit(1);
    
    if (testError || !testInstances || testInstances.length === 0) {
      console.log('⚠️ No instances available for testing message insertion');
      return;
    }
    
    const testInstanceId = testInstances[0].instance_id;
    console.log(`🔍 Testing message insertion with instance ID: ${testInstanceId}`);
    
    const { data: testMessage, error: messageError } = await supabase
      .from('green_api_message_queue')
      .insert({
        instance_id: testInstanceId,
        chat_id: 'test@c.us',
        message_type: 'text',
        content: 'Test message to verify fix',
        metadata: {},
        priority: 0,
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Test message insertion failed:', messageError);
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('The foreign key constraint needs to be updated manually in Supabase Dashboard:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Execute this SQL:');
      console.log('');
      console.log('ALTER TABLE green_api_message_queue DROP CONSTRAINT IF EXISTS green_api_message_queue_instance_id_fkey;');
      console.log('ALTER TABLE green_api_message_queue ADD CONSTRAINT green_api_message_queue_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE;');
      console.log('');
    } else {
      console.log('✅ Test message insertion successful!');
      
      // Clean up test message
      await supabase
        .from('green_api_message_queue')
        .delete()
        .eq('id', testMessage.id);
      
      console.log('🧹 Test message cleaned up.');
      console.log('✅ The foreign key constraint is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check and fix
checkAndFixInstances();
