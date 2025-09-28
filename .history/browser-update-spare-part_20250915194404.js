// Run this in the browser console on your app (localhost:5182)
// This will update the iPhone 6 LCD spare part with proper values

async function updateSparePart() {
  try {
    console.log('🔧 Updating iPhone 6 LCD spare part...');
    
    // Get the supabase client from the app
    const { supabase } = await import('./src/lib/supabaseClient.js');
    
    const sparePartId = '1fcd624d-f85a-465c-8a48-4572c0a78170';
    
    // Update spare part with proper values
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .update({
        quantity: 10,
        min_quantity: 2,
        cost_price: 50000,
        selling_price: 75000,
        updated_at: new Date().toISOString()
      })
      .eq('id', sparePartId)
      .select();

    if (error) {
      console.error('❌ Error updating spare part:', error);
      return;
    }

    console.log('✅ Spare part updated successfully!');
    console.log('📊 Updated values:');
    console.log('  - Quantity: 10 units');
    console.log('  - Min Quantity: 2 units');
    console.log('  - Cost Price: TSh 50,000');
    console.log('  - Selling Price: TSh 75,000');
    console.log('  - Total Value: TSh 500,000');
    console.log('  - Profit: TSh 250,000');
    
    // Refresh the page to see changes
    console.log('🔄 Refreshing page to show changes...');
    window.location.reload();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
updateSparePart();
