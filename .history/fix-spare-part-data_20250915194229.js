const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTc2NzQsImV4cCI6MjA1MDU3MzY3NH0.iGgZJYfYQjZJYfYQjZJYfYQjZJYfYQjZJYfYQjZJYfY';

const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log('✅ Spare part updated successfully:', data[0]);
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
