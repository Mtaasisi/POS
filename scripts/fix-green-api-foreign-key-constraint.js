import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix-green-api-foreign-key-constraint.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Executing SQL to fix foreign key constraint...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Foreign key constraint fix completed successfully!');
    console.log('📋 Result:', data);
    
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
