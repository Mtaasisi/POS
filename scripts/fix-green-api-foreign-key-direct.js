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

console.log('🔧 Fixing Green API Message Queue Foreign Key Constraint');
console.log('=========================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGreenApiForeignKeyConstraint() {
  try {
    console.log('📋 Checking current foreign key constraints...');
    
    // Check current constraint
    const { data: currentConstraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('constraint_name', 'green_api_message_queue_instance_id_fkey')
      .eq('table_name', 'green_api_message_queue');
    
    if (constraintError) {
      console.log('Could not check constraints via table query, proceeding with fix...');
    } else {
      console.log('Current constraints:', currentConstraints);
    }
    
    console.log('\n📋 Step 1: Dropping existing foreign key constraint...');
    
    // Step 1: Drop existing foreign key constraint
    try {
      const { error: dropError } = await supabase.rpc('exec', {
        sql: `
          DO $$ 
          BEGIN
              IF EXISTS (
                  SELECT 1 
                  FROM information_schema.table_constraints 
                  WHERE constraint_name = 'green_api_message_queue_instance_id_fkey' 
                  AND table_name = 'green_api_message_queue'
              ) THEN
                  ALTER TABLE green_api_message_queue 
                  DROP CONSTRAINT green_api_message_queue_instance_id_fkey;
                  RAISE NOTICE 'Dropped existing foreign key constraint';
              ELSE
                  RAISE NOTICE 'Foreign key constraint does not exist, skipping drop';
              END IF;
          END $$;
        `
      });
      
      if (dropError) {
        console.log('⚠️ Could not drop constraint using exec, trying direct approach...');
        
        // Try direct SQL execution
        const dropSQL = `ALTER TABLE green_api_message_queue DROP CONSTRAINT IF EXISTS green_api_message_queue_instance_id_fkey`;
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: dropSQL })
        });
        
        if (!response.ok) {
          console.log('⚠️ Could not drop constraint, it may not exist. Continuing...');
        }
      } else {
        console.log('✅ Dropped existing foreign key constraint');
      }
    } catch (error) {
      console.log('⚠️ Could not drop constraint, it may not exist. Continuing...');
    }
    
    console.log('\n📋 Step 2: Adding new foreign key constraint...');
    
    // Step 2: Add new foreign key constraint
    try {
      const addSQL = `
        ALTER TABLE green_api_message_queue 
        ADD CONSTRAINT green_api_message_queue_instance_id_fkey 
        FOREIGN KEY (instance_id) 
        REFERENCES whatsapp_instances_comprehensive(instance_id) 
        ON DELETE CASCADE
      `;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: addSQL })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error adding new constraint:', errorText);
        return;
      }
      
      console.log('✅ Added new foreign key constraint');
    } catch (error) {
      console.error('❌ Error adding new constraint:', error);
      return;
    }
    
    console.log('\n📋 Step 3: Migrating data if needed...');
    
    // Step 3: Migrate data from whatsapp_instances to whatsapp_instances_comprehensive if needed
    try {
      const { data: oldInstances, error: oldError } = await supabase
        .from('whatsapp_instances')
        .select('*');
      
      if (!oldError && oldInstances && oldInstances.length > 0) {
        console.log(`Found ${oldInstances.length} instances in old table, migrating...`);
        
        for (const instance of oldInstances) {
          const { error: insertError } = await supabase
            .from('whatsapp_instances_comprehensive')
            .upsert({
              instance_id: instance.instance_id,
              api_token: instance.api_token,
              phone_number: instance.phone_number,
              status: instance.status,
              created_at: instance.created_at,
              updated_at: instance.updated_at
            }, {
              onConflict: 'instance_id'
            });
          
          if (insertError) {
            console.log(`⚠️ Could not migrate instance ${instance.instance_id}:`, insertError.message);
          }
        }
        
        console.log('✅ Data migration completed');
      } else {
        console.log('No data to migrate from old table');
      }
    } catch (error) {
      console.log('⚠️ Could not migrate data:', error.message);
    }
    
    // Test the fix by checking if we can insert a test message
    console.log('\n🧪 Testing the fix...');
    
    // First, ensure there's at least one instance for testing
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('instance_id')
      .limit(1);
    
    if (instanceError) {
      console.error('❌ Error fetching instances for test:', instanceError);
      return;
    }
    
    if (!instances || instances.length === 0) {
      console.log('⚠️ No instances found in whatsapp_instances_comprehensive for testing');
      console.log('The foreign key constraint should be fixed, but testing requires at least one instance.');
      return;
    }
    
    const testInstanceId = instances[0].instance_id;
    console.log(`🔍 Testing with instance ID: ${testInstanceId}`);
    
    // Try to insert a test message
    const { data: testMessage, error: testError } = await supabase
      .from('green_api_message_queue')
      .insert({
        instance_id: testInstanceId,
        chat_id: 'test@c.us',
        message_type: 'text',
        content: 'Test message to verify foreign key fix',
        metadata: {},
        priority: 0,
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test insert failed:', testError);
      console.error('The foreign key constraint fix may not have worked properly.');
    } else {
      console.log('✅ Test insert successful! Foreign key constraint is working.');
      
      // Clean up test message
      await supabase
        .from('green_api_message_queue')
        .delete()
        .eq('id', testMessage.id);
      
      console.log('🧹 Test message cleaned up.');
    }
    
    console.log('\n🎉 Foreign key constraint fix process completed!');
    console.log('The green_api_message_queue table now references whatsapp_instances_comprehensive.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixGreenApiForeignKeyConstraint();
