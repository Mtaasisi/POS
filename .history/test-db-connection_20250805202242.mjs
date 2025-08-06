import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testConnection() {
  console.log('🔧 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('products').select('count');
    
    if (error) {
      console.log('❌ Error connecting to products table:', error.message);
      
      // Check if it's a missing table error
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('📋 Products table does not exist. Need to create it.');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Products table exists and is accessible');
    return true;
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

testConnection().then(exists => {
  if (!exists) {
    console.log('💡 You may need to run the database setup scripts');
  }
  process.exit(0);
}); 