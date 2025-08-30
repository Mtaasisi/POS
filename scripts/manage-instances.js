import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listInstances() {
  try {
    console.log('🔍 Loading all WhatsApp instances...');
    console.log('='.repeat(80));
    
    const { data: instances, error } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching instances:', error);
      return [];
    }

    if (!instances || instances.length === 0) {
      console.log('⚠️ No instances found in database');
      return [];
    }

    console.log(`📋 Found ${instances.length} instance(s):\n`);
    
    instances.forEach((instance, index) => {
      const statusIcon = instance.status === 'connected' ? '✅' : 
                        instance.status === 'error' ? '❌' : 
                        instance.status === 'disconnected' ? '🔴' : '⚪';
      
      const activeIcon = instance.is_active ? '🟢' : '🔴';
      
      console.log(`${index + 1}. ${statusIcon} Instance: ${instance.instance_id}`);
      console.log(`   Name: ${instance.instance_name || 'Not set'}`);
      console.log(`   Status: ${instance.status} | State: ${instance.state_instance}`);
      console.log(`   Active: ${activeIcon} ${instance.is_active}`);
      console.log(`   API Token: ${instance.api_token ? instance.api_token.substring(0, 15) + '...' : 'Not set'}`);
      console.log(`   Host: ${instance.green_api_host}`);
      console.log(`   Phone: ${instance.phone_number || 'Not set'}`);
      console.log(`   Created: ${new Date(instance.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(instance.updated_at).toLocaleString()}`);
      console.log('   ' + '-'.repeat(70));
    });

    return instances;
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}

async function deleteInstance(instanceId) {
  try {
    console.log(`\n🗑️ Deleting instance: ${instanceId}...`);
    
    // First delete related settings
    const { error: settingsError } = await supabase
      .from('whatsapp_connection_settings')
      .delete()
      .eq('instance_id', instanceId);
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.log(`⚠️ Note: Could not delete settings for ${instanceId}:`, settingsError.message);
    }
    
    // Delete QR codes
    const { error: qrError } = await supabase
      .from('whatsapp_qr_codes')
      .delete()
      .eq('instance_id', instanceId);
    
    if (qrError && qrError.code !== 'PGRST116') {
      console.log(`⚠️ Note: Could not delete QR codes for ${instanceId}:`, qrError.message);
    }
    
    // Delete the main instance
    const { error } = await supabase
      .from('whatsapp_instances_comprehensive')
      .delete()
      .eq('instance_id', instanceId);

    if (error) {
      console.error('❌ Error deleting instance:', error);
      return false;
    }

    console.log(`✅ Successfully deleted instance: ${instanceId}`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🗂️ WhatsApp Instance Manager');
    console.log('============================\n');
    
    while (true) {
      const instances = await listInstances();
      
      if (instances.length === 0) {
        console.log('\n🎉 No instances to manage. Exiting...');
        break;
      }
      
      console.log('\nOptions:');
      console.log('1. Delete a specific instance');
      console.log('2. Delete all inactive instances');
      console.log('3. Delete all error instances');
      console.log('4. Refresh list');
      console.log('5. Exit');
      
      const choice = await question('\nEnter your choice (1-5): ');
      
      switch (choice) {
        case '1': {
          const instanceId = await question('\nEnter instance ID to delete: ');
          
          const instance = instances.find(i => i.instance_id === instanceId);
          if (!instance) {
            console.log('❌ Instance not found!');
            break;
          }
          
          // Warning for active instances
          if (instance.is_active) {
            console.log(`\n⚠️ WARNING: Instance ${instanceId} is currently ACTIVE!`);
            console.log('This might be the instance your app is currently using.');
            const confirm = await question('Are you sure you want to delete it? (yes/no): ');
            if (confirm.toLowerCase() !== 'yes') {
              console.log('🚫 Deletion cancelled.');
              break;
            }
          }
          
          // Warning for working instances  
          if (instance.status === 'connected' || instance.state_instance === 'authorized') {
            console.log(`\n⚠️ WARNING: Instance ${instanceId} appears to be working!`);
            const confirm = await question('Are you sure you want to delete it? (yes/no): ');
            if (confirm.toLowerCase() !== 'yes') {
              console.log('🚫 Deletion cancelled.');
              break;
            }
          }
          
          await deleteInstance(instanceId);
          break;
        }
        
        case '2': {
          const inactiveInstances = instances.filter(i => !i.is_active);
          if (inactiveInstances.length === 0) {
            console.log('📋 No inactive instances found.');
            break;
          }
          
          console.log(`\n🗑️ Found ${inactiveInstances.length} inactive instance(s):`);
          inactiveInstances.forEach(i => console.log(`   - ${i.instance_id} (${i.instance_name || 'No name'})`));
          
          const confirm = await question(`\nDelete all ${inactiveInstances.length} inactive instances? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            for (const instance of inactiveInstances) {
              await deleteInstance(instance.instance_id);
            }
          } else {
            console.log('🚫 Deletion cancelled.');
          }
          break;
        }
        
        case '3': {
          const errorInstances = instances.filter(i => i.status === 'error' || i.state_instance === 'error');
          if (errorInstances.length === 0) {
            console.log('📋 No error instances found.');
            break;
          }
          
          console.log(`\n🗑️ Found ${errorInstances.length} error instance(s):`);
          errorInstances.forEach(i => console.log(`   - ${i.instance_id} (${i.instance_name || 'No name'})`));
          
          const confirm = await question(`\nDelete all ${errorInstances.length} error instances? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            for (const instance of errorInstances) {
              await deleteInstance(instance.instance_id);
            }
          } else {
            console.log('🚫 Deletion cancelled.');
          }
          break;
        }
        
        case '4': {
          console.log('🔄 Refreshing...\n');
          continue;
        }
        
        case '5': {
          console.log('👋 Goodbye!');
          rl.close();
          return;
        }
        
        default: {
          console.log('❌ Invalid choice. Please enter 1-5.');
          break;
        }
      }
      
      await question('\nPress Enter to continue...');
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

main();

