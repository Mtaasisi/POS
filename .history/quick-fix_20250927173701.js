// Quick fix script - run this in browser console
// This directly updates the order status without complex logic

async function quickFixOrder() {
  try {
    console.log('🔧 Starting quick fix...');
    
    // The order ID from your console logs
    const orderId = 'e5fe9845-0c0f-4b44-b29a-98c54559a5ca';
    
    // Import supabase client (assuming it's available globally)
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    
    // Create client with your credentials
    const supabase = createClient(
      'https://jxhzveborezjhsmzsgbc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MTY0NzYsImV4cCI6MjA1MDE5MjQ3Nn0.9lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8lZ8'
    );
    
    // Direct update
    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'received',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('❌ Update failed:', error);
      alert('Update failed: ' + error.message);
    } else {
      console.log('✅ Order status updated successfully!');
      alert('Order status has been updated to "received"! Please refresh the page.');
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
    alert('Script error: ' + error.message);
  }
}

// Auto-run if on the right page
if (window.location.pathname.includes('e5fe9845-0c0f-4b44-b29a-98c54559a5ca')) {
  console.log('🎯 Detected the order page, running quick fix...');
  quickFixOrder();
} else {
  console.log('📋 Quick fix script loaded. Run quickFixOrder() to fix the order.');
}
