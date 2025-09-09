// Quick test to check if shipping information is being fetched correctly
// Run this in your browser console on the app page

async function quickShippingCheck() {
  console.log('⚡ Quick Shipping Information Check...');
  
  if (typeof window === 'undefined' || !window.supabase) {
    console.error('❌ Supabase client not found.');
    return;
  }

  try {
    // Get all sample orders
    const { data: orders, error } = await window.supabase
      .from('lats_purchase_orders')
      .select('*')
      .like('order_number', 'PO-SAMPLE-%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📦 Found ${orders?.length || 0} sample orders`);

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\n📋 Order ${index + 1}: ${order.order_number}`);
        console.log('  ✅ Status:', order.status);
        console.log('  ✅ Tracking Number:', order.tracking_number || 'N/A');
        console.log('  ✅ Shipping Status:', order.shipping_status || 'N/A');
        console.log('  ✅ Shipped Date:', order.shipped_date || 'N/A');
        console.log('  ✅ Estimated Delivery:', order.estimated_delivery_date || 'N/A');
        console.log('  ✅ Shipping Notes:', order.shipping_notes || 'N/A');
        console.log('  ✅ Total Amount:', order.total_amount || 'N/A', order.currency || 'TZS');
        
        // Test carrier detection
        const carrier = order.tracking_number?.startsWith('DHL') ? 'DHL Express' : 
                       order.tracking_number?.startsWith('FEDEX') ? 'FedEx' :
                       order.tracking_number?.startsWith('UPS') ? 'UPS' :
                       order.tracking_number?.startsWith('MAERSK') ? 'Maersk Line' :
                       order.tracking_number?.startsWith('TED') ? 'Tanzania Express Delivery' :
                       'Unknown Carrier';
        console.log('  ✅ Detected Carrier:', carrier);
        
        // Check if all required fields are present
        const hasTracking = !!order.tracking_number;
        const hasShippingStatus = !!order.shipping_status;
        const hasShippedDate = !!order.shipped_date;
        const hasEstimatedDelivery = !!order.estimated_delivery_date;
        
        console.log('  📊 Data Completeness:');
        console.log('    - Tracking Number:', hasTracking ? '✅' : '❌');
        console.log('    - Shipping Status:', hasShippingStatus ? '✅' : '❌');
        console.log('    - Shipped Date:', hasShippedDate ? '✅' : '❌');
        console.log('    - Estimated Delivery:', hasEstimatedDelivery ? '✅' : '❌');
        
        const completeness = [hasTracking, hasShippingStatus, hasShippedDate, hasEstimatedDelivery].filter(Boolean).length;
        console.log(`    - Overall: ${completeness}/4 fields (${Math.round(completeness/4*100)}%)`);
      });
    }

    // Test shipping management page data
    console.log('\n🚢 Shipping Management Page Data:');
    const shippedOrders = orders?.filter(order => 
      (order.status === 'shipped' || order.status === 'received') && 
      order.tracking_number
    ) || [];
    
    console.log(`📦 Orders with shipping info: ${shippedOrders.length}`);
    
    if (shippedOrders.length > 0) {
      console.log('✅ These orders will appear on the shipping management page:');
      shippedOrders.forEach(order => {
        console.log(`  - ${order.order_number}: ${order.status} (${order.tracking_number})`);
      });
    } else {
      console.log('❌ No orders found for shipping management page');
    }

    console.log('\n🎯 Test Summary:');
    console.log(`  - Total Orders: ${orders?.length || 0}`);
    console.log(`  - Orders with Shipping: ${shippedOrders.length}`);
    console.log(`  - Data Quality: ${shippedOrders.length > 0 ? 'Good' : 'Needs Improvement'}`);

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

// Run the test
quickShippingCheck();
