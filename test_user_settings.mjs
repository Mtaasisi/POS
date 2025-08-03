import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserSettings() {
  try {
    console.log('🧪 Testing user_settings table...');
    
    // Test 1: Check if table exists and is accessible
    console.log('📋 Test 1: Checking table accessibility...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    } else {
      console.log('✅ Table is accessible');
      console.log('📊 Current records:', tableData);
    }
    
    // Test 2: Check table structure
    console.log('\n📋 Test 2: Checking table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('user_settings')
      .select('id, user_id, settings, created_at, updated_at')
      .limit(0);
    
    if (structureError) {
      console.error('❌ Structure check error:', structureError);
    } else {
      console.log('✅ Table structure is correct');
    }
    
    // Test 3: Try to insert a test record (this will fail due to RLS, but that's expected)
    console.log('\n📋 Test 3: Testing RLS policies...');
    const testUserId = 'a15a9139-3be9-4028-b944-240caae9eeb2'; // The user ID from your error
    const { data: insertData, error: insertError } = await supabase
      .from('user_settings')
      .insert({
        user_id: testUserId,
        settings: {
          displayName: 'Test User',
          email: 'test@example.com',
          theme: 'auto'
        }
      })
      .select();
    
    if (insertError) {
      console.log('ℹ️ Insert failed (expected due to RLS):', insertError.message);
    } else {
      console.log('✅ Test record inserted successfully');
    }
    
    // Test 4: Check if we can query by user_id
    console.log('\n📋 Test 4: Testing user_id query...');
    const { data: queryData, error: queryError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', testUserId);
    
    if (queryError) {
      console.error('❌ Query error:', queryError);
    } else {
      console.log('✅ Query by user_id works');
      console.log('📊 Records for user:', queryData);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testUserSettings(); 