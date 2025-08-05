import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testCustomerSchema() {
  try {
    console.log('🔍 Testing customer table schema...');
    
    // Get a sample customer to see the structure
    const { data: sampleCustomer, error: sampleError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error fetching sample customer:', sampleError);
      return;
    }
    
    if (sampleCustomer && sampleCustomer.length > 0) {
      console.log('📋 Sample customer structure:');
      console.log(JSON.stringify(sampleCustomer[0], null, 2));
      
      // Test updating a customer with minimal data
      const customerId = sampleCustomer[0].id;
      console.log(`\n🧪 Testing update for customer: ${customerId}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('customers')
        .update({ 
          updated_at: new Date().toISOString(),
          name: sampleCustomer[0].name // Keep the same name
        })
        .eq('id', customerId)
        .select();
      
      if (updateError) {
        console.error('❌ Update error:', updateError);
        console.error('Error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      } else {
        console.log('✅ Update successful:', updateData);
      }
    } else {
      console.log('⚠️ No customers found in database');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCustomerSchema(); 