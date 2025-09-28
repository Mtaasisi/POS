// Quick fix script for purchase order status
// Run this in the browser console when on the purchase order page

async function fixOrderStatus() {
  try {
    // Get the current order ID from the URL
    const orderId = window.location.pathname.split('/').pop();
    console.log('🔧 Fixing order status for:', orderId);
    
    // Import the service (assuming it's available globally or through the store)
    const { PurchaseOrderService } = await import('./src/features/lats/services/purchaseOrderService.ts');
    
    // Get current user ID (you may need to adjust this based on your auth setup)
    const userId = 'a7c9adb7-f525-4850-bd42-79a769f12953'; // From your console logs
    
    // Fix the order status
    const result = await PurchaseOrderService.fixOrderStatusIfNeeded(orderId, userId);
    
    if (result.success) {
      if (result.statusChanged) {
        console.log('✅ Order status fixed:', result.message);
        alert('Order status has been corrected to "received"!');
        // Reload the page to show updated status
        window.location.reload();
      } else {
        console.log('ℹ️ Order status was already correct:', result.message);
        alert('Order status is already correct.');
      }
    } else {
      console.error('❌ Failed to fix order:', result.message);
      alert('Failed to fix order status: ' + result.message);
    }
  } catch (error) {
    console.error('❌ Error running fix:', error);
    alert('Error running fix: ' + error.message);
  }
}

// Alternative: Direct database query fix
async function fixOrderDirectly() {
  try {
    const orderId = 'e5fe9845-0c0f-4b44-b29a-98c54559a5ca'; // From your console logs
    
    console.log('🔧 Directly fixing order:', orderId);
    
    // This would need to be run with access to your Supabase client
    // You can run this in the browser console if you have access to the supabase client
    
    alert('Please navigate to the purchase order page and refresh it. The status should automatically fix itself.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

console.log('🚀 Fix functions loaded!');
console.log('Run fixOrderStatus() to fix the current order');
console.log('Or run fixOrderDirectly() for a direct approach');

// Auto-run if we're on the right page
if (window.location.pathname.includes('purchase-orders') && window.location.pathname.includes('PO-')) {
  console.log('🎯 Detected purchase order page, auto-fixing...');
  setTimeout(fixOrderStatus, 1000);
}
