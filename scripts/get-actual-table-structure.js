import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getActualTableStructure() {
  try {
    console.log('🔍 Getting actual whatsapp_messages table structure...');
    
    // Try to get all data to see what columns exist
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error getting table structure:', error);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Try to insert a minimal record to see what columns are required
    console.log('\n🧪 Testing minimal insert...');
    
    const minimalData = {
      chat_id: 'test-chat-003',
      content: 'Test message content',
      message_type: 'text'
    };
    
    const { error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert(minimalData);
    
    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError.message);
      
      // Try to get the table schema from information_schema
      console.log('\n📊 Trying to get schema from information_schema...');
      
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: 'whatsapp_messages' });
      
      if (schemaError) {
        console.log('❌ Could not get schema via RPC:', schemaError.message);
        
        // Try direct query to information_schema
        console.log('\n📊 Trying direct information_schema query...');
        
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'whatsapp_messages')
          .eq('table_schema', 'public')
          .order('ordinal_position');
        
        if (columnsError) {
          console.log('❌ Could not get columns from information_schema:', columnsError.message);
        } else {
          console.log('📋 Actual table columns:');
          columnsData.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
          });
        }
      } else {
        console.log('📋 Table columns from RPC:');
        console.log(schemaData);
      }
    } else {
      console.log('✅ Minimal insert successful');
      console.log('📋 Table accepts these columns:', Object.keys(minimalData));
    }
    
    // Try to get existing data to see the structure
    console.log('\n📊 Getting existing data structure...');
    
    const { data: existingData, error: existingError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(5);
    
    if (existingError) {
      console.log('❌ Could not get existing data:', existingError.message);
    } else if (existingData && existingData.length > 0) {
      console.log('📋 Existing data structure:');
      console.log('Columns:', Object.keys(existingData[0]));
      console.log('Sample record:', existingData[0]);
    } else {
      console.log('📋 Table is empty, no existing data to analyze');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
getActualTableStructure();
