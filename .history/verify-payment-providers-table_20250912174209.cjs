const { createClient } = require('@supabase/supabase-js');

// Use the credentials from the scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPaymentProvidersTable() {
  try {
    console.log('🔍 Verifying payment_providers table...');
    
    // Check if the table exists by trying to query it
    const { data, error } = await supabase
      .from('payment_providers')
      .select('id, name, type, status')
      .limit(5);
    
    if (error) {
      console.error('❌ Table verification failed:', error.message);
      return false;
    }
    
    console.log('✅ payment_providers table exists!');
    console.log('📊 Found', data.length, 'records:');
    data.forEach((provider, index) => {
      console.log(`   ${index + 1}. ${provider.name} (${provider.type}) - ${provider.status}`);
    });
    
    // Test the specific record that was failing
    console.log('\n🔍 Testing the specific record that was failing...');
    const { data: specificRecord, error: specificError } = await supabase
      .from('payment_providers')
      .select('id, name')
      .eq('id', '1ff7da5b-340c-4d16-b2b6-0c65076c4ab8')
      .single();
    
    if (specificError) {
      console.log('⚠️ Specific record not found:', specificError.message);
      console.log('💡 This is expected if the record was never created');
    } else {
      console.log('✅ Specific record found:', specificRecord);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run the verification
verifyPaymentProvidersTable();
