import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking whatsapp_messages table structure...');
    
    // Try to get table structure by attempting different column names
    const testColumns = [
      'timestamp',
      'message_timestamp',
      'created_at',
      'updated_at',
      'message_id',
      'chat_id',
      'content',
      'message_type',
      'is_from_me',
      'customer_phone',
      'customer_name',
      'processed',
      'auto_replied'
    ];
    
    console.log('📊 Testing column names...');
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('whatsapp_messages')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`❌ Column '${column}' does not exist`);
        } else if (error) {
          console.log(`⚠️ Column '${column}' error: ${error.message}`);
        } else {
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}' test failed: ${err.message}`);
      }
    }
    
    // Try to insert a test record with different timestamp column names
    console.log('\n🧪 Testing insert with different timestamp column names...');
    
    const testData = {
      message_id: 'test-message-002',
      chat_id: 'test-chat-002',
      content: 'Test message content',
      message_type: 'text',
      is_from_me: false,
      customer_phone: '+1234567890',
      customer_name: 'Test Customer'
    };
    
    // Test with 'timestamp' column
    try {
      const { error: timestampError } = await supabase
        .from('whatsapp_messages')
        .insert({
          ...testData,
          timestamp: new Date().toISOString()
        });
      
      if (timestampError) {
        console.log('❌ Insert with "timestamp" column failed:', timestampError.message);
      } else {
        console.log('✅ Insert with "timestamp" column successful');
      }
    } catch (err) {
      console.log('❌ Insert with "timestamp" column failed:', err.message);
    }
    
    // Test with 'message_timestamp' column
    try {
      const { error: messageTimestampError } = await supabase
        .from('whatsapp_messages')
        .insert({
          ...testData,
          message_timestamp: new Date().toISOString()
        });
      
      if (messageTimestampError) {
        console.log('❌ Insert with "message_timestamp" column failed:', messageTimestampError.message);
      } else {
        console.log('✅ Insert with "message_timestamp" column successful');
      }
    } catch (err) {
      console.log('❌ Insert with "message_timestamp" column failed:', err.message);
    }
    
    // Test with 'created_at' column
    try {
      const { error: createdAtError } = await supabase
        .from('whatsapp_messages')
        .insert({
          ...testData,
          created_at: new Date().toISOString()
        });
      
      if (createdAtError) {
        console.log('❌ Insert with "created_at" column failed:', createdAtError.message);
      } else {
        console.log('✅ Insert with "created_at" column successful');
      }
    } catch (err) {
      console.log('❌ Insert with "created_at" column failed:', err.message);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('Based on the test results above, update the Chrome extension service to use the correct column name.');
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

// Run the check
checkTableStructure();
