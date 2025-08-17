// Script to test the current suppliers table structure
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSuppliersSchema() {
  try {
    console.log('🔍 Testing suppliers table structure...');
    
    // Try to insert a test supplier with the new fields
    const testSupplier = {
      name: 'Test Supplier',
      company_name: 'Test Company',
      description: 'Test description',
      phone: '+1234567890',
      phone2: '+1234567891',
      whatsapp: '+1234567892',
      instagram: '@testsupplier',
      wechat_id: 'testwechat',
      city: 'Test City',
      country: 'TZ',
      payment_account_type: 'mobile_money',
      mobile_money_account: '0712345678',
      bank_account_number: '1234567890',
      bank_name: 'Test Bank'
    };
    
    console.log('📝 Attempting to insert test supplier...');
    const { data, error } = await supabase
      .from('lats_suppliers')
      .insert(testSupplier)
      .select();
    
    if (error) {
      console.error('❌ Insert failed:', error);
      
      // Try with only the basic fields
      console.log('🔄 Trying with basic fields only...');
      const basicSupplier = {
        name: 'Test Supplier Basic',
        contact_person: 'Test Person',
        email: 'test@example.com',
        phone: '+1234567890'
      };
      
      const { data: basicData, error: basicError } = await supabase
        .from('lats_suppliers')
        .insert(basicSupplier)
        .select();
      
      if (basicError) {
        console.error('❌ Basic insert also failed:', basicError);
      } else {
        console.log('✅ Basic insert successful:', basicData);
        
        // Now try to update with new fields
        console.log('🔄 Trying to update with new fields...');
        const { data: updateData, error: updateError } = await supabase
          .from('lats_suppliers')
          .update({
            company_name: 'Updated Company',
            description: 'Updated description',
            whatsapp: '+1234567892'
          })
          .eq('id', basicData[0].id)
          .select();
        
        if (updateError) {
          console.error('❌ Update failed:', updateError);
        } else {
          console.log('✅ Update successful:', updateData);
        }
      }
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up the test data
      console.log('🧹 Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('lats_suppliers')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.error('❌ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Cleanup successful');
      }
    }
    
    // Check existing suppliers
    console.log('📋 Checking existing suppliers...');
    const { data: existingSuppliers, error: fetchError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError);
    } else {
      console.log('📋 Existing suppliers:', existingSuppliers);
    }
    
  } catch (error) {
    console.error('❌ Test script failed:', error);
  }
}

// Run the test
testSuppliersSchema();
