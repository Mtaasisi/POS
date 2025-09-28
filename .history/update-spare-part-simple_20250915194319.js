// Simple script to update spare part using existing app configuration
import { supabase } from './src/lib/supabaseClient.js';

async function updateSparePart() {
  try {
    console.log('🔧 Updating iPhone 6 LCD spare part...');
    
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

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateSparePart();
