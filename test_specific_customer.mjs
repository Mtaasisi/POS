import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testSpecificCustomer() {
  try {
    const customerId = 'c4aa2553-c004-464e-8b14-dea85379a89d';
    console.log(`🔍 Testing customer: ${customerId}`);
    
    // First, let's get the current customer data
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching customer:', fetchError);
      return;
    }
    
    console.log('📋 Current customer data:');
    console.log(JSON.stringify(customer, null, 2));
    
    // Test different update scenarios
    console.log('\n🧪 Testing minimal update...');
    const { data: update1, error: error1 } = await supabase
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .select();
    
    if (error1) {
      console.error('❌ Minimal update failed:', error1);
    } else {
      console.log('✅ Minimal update successful');
    }
    
    // Test with name update
    console.log('\n🧪 Testing name update...');
    const { data: update2, error: error2 } = await supabase
      .from('customers')
      .update({ 
        name: customer.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select();
    
    if (error2) {
      console.error('❌ Name update failed:', error2);
    } else {
      console.log('✅ Name update successful');
    }
    
    // Test with phone update
    console.log('\n🧪 Testing phone update...');
    const { data: update3, error: error3 } = await supabase
      .from('customers')
      .update({ 
        phone: customer.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select();
    
    if (error3) {
      console.error('❌ Phone update failed:', error3);
    } else {
      console.log('✅ Phone update successful');
    }
    
    // Test with multiple fields
    console.log('\n🧪 Testing multiple fields update...');
    const { data: update4, error: error4 } = await supabase
      .from('customers')
      .update({ 
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select();
    
    if (error4) {
      console.error('❌ Multiple fields update failed:', error4);
      console.error('Error details:', {
        code: error4.code,
        message: error4.message,
        details: error4.details,
        hint: error4.hint
      });
    } else {
      console.log('✅ Multiple fields update successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificCustomer(); 