import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testPOSData() {
  console.log('🔧 Testing POS data loading...');
  
  try {
    // Test products loading
    console.log('📦 Testing products loading...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    if (productsError) {
      console.log('❌ Products error:', productsError.message);
    } else {
      console.log('✅ Products loaded:', products?.length || 0, 'items');
    }
    
    // Test customers loading
    console.log('👥 Testing customers loading...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log('❌ Customers error:', customersError.message);
    } else {
      console.log('✅ Customers loaded:', customers?.length || 0, 'items');
    }
    
    // Test payment accounts loading
    console.log('💰 Testing payment accounts loading...');
    const { data: paymentAccounts, error: paymentError } = await supabase
      .from('finance_accounts')
      .select('*')
      .limit(5);
    
    if (paymentError) {
      console.log('❌ Payment accounts error:', paymentError.message);
    } else {
      console.log('✅ Payment accounts loaded:', paymentAccounts?.length || 0, 'items');
    }
    
    // Test locations loading
    console.log('📍 Testing locations loading...');
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5);
    
    if (locationsError) {
      console.log('❌ Locations error:', locationsError.message);
    } else {
      console.log('✅ Locations loaded:', locations?.length || 0, 'items');
    }
    
  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

testPOSData().then(() => {
  console.log('🎯 POS data test completed');
  process.exit(0);
}); 