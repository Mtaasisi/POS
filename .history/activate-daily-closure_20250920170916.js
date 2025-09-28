// Quick test script to activate daily closure system
// Run this in your browser console on the Sales Reports page

// Test data
const testClosureData = {
  date: new Date().toISOString().split('T')[0],
  total_sales: 150000.00,
  total_transactions: 25,
  closed_at: new Date().toISOString(),
  closed_by: 'test_user',
  closed_by_user_id: '5cdb5078-26e3-4694-8096-1f7437b4dea8',
  sales_data: { test: 'data' }
};

// Function to test the system
async function testDailyClosure() {
  try {
    console.log('🧪 Testing daily closure system...');
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Make sure you are on a page with supabase imported.');
      return;
    }
    
    // Insert test closure record
    const { data, error } = await supabase
      .from('daily_sales_closures')
      .upsert(testClosureData);
    
    if (error) {
      console.error('❌ Error creating test closure:', error);
      return;
    }
    
    console.log('✅ Test closure record created successfully!');
    console.log('🎯 Now go to POS page and try to process a payment to see the warning modal.');
    
    // Clean up function
    window.removeTestClosure = async () => {
      const { error } = await supabase
        .from('daily_sales_closures')
        .delete()
        .eq('date', testClosureData.date);
      
      if (error) {
        console.error('❌ Error removing test closure:', error);
      } else {
        console.log('✅ Test closure record removed.');
      }
    };
    
    console.log('💡 To remove test record later, run: removeTestClosure()');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testDailyClosure();
