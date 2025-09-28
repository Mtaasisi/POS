// Debug script to test device updates
// Run this in the browser console to test device updates

async function testDeviceUpdate() {
  console.log('🔍 Testing device update...');
  
  // Test device ID from the error
  const testDeviceId = 'a4504cd2-5ea9-4b34-a73d-25dd75b0741d';
  
  try {
    // First, check if the device exists
    console.log('1️⃣ Checking if device exists...');
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', testDeviceId)
      .single();
      
    if (fetchError) {
      console.error('❌ Device not found:', fetchError);
      return;
    }
    
    console.log('✅ Device found:', device);
    
    // Test a simple update
    console.log('2️⃣ Testing simple update...');
    const { data: updateData, error: updateError } = await supabase
      .from('devices')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', testDeviceId)
      .select();
      
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Update successful:', updateData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeviceUpdate();
