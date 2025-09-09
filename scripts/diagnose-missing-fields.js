// Diagnostic script to identify which shipping fields are not fetching correctly
// Run this in your browser console on the app page

async function diagnoseMissingFields() {
  console.log('🔍 Diagnosing Missing Shipping Fields...');
  
  if (typeof window === 'undefined' || !window.supabase) {
    console.error('❌ Supabase client not found.');
    return;
  }

  try {
    // Get raw database data
    console.log('📊 Step 1: Checking Raw Database Data');
    const { data: rawOrders, error: rawError } = await window.supabase
      .from('lats_purchase_orders')
      .select('*')
      .like('order_number', 'PO-SAMPLE-%')
      .order('created_at', { ascending: false });

    if (rawError) {
      console.error('❌ Error fetching raw orders:', rawError);
      return;
    }

    console.log(`✅ Found ${rawOrders?.length || 0} raw orders`);

    if (rawOrders && rawOrders.length > 0) {
      rawOrders.forEach((order, index) => {
        console.log(`\n📦 Raw Order ${index + 1}: ${order.order_number}`);
        console.log('  Database Fields:');
        console.log('    - order_number:', order.order_number || '❌ MISSING');
        console.log('    - status:', order.status || '❌ MISSING');
        console.log('    - tracking_number:', order.tracking_number || '❌ MISSING');
        console.log('    - shipping_status:', order.shipping_status || '❌ MISSING');
        console.log('    - shipped_date:', order.shipped_date || '❌ MISSING');
        console.log('    - estimated_delivery_date:', order.estimated_delivery_date || '❌ MISSING');
        console.log('    - shipping_notes:', order.shipping_notes || '❌ MISSING');
        console.log('    - total_amount:', order.total_amount || '❌ MISSING');
        console.log('    - currency:', order.currency || '❌ MISSING');
        console.log('    - created_at:', order.created_at || '❌ MISSING');
        console.log('    - updated_at:', order.updated_at || '❌ MISSING');
      });
    }

    // Test data provider
    console.log('\n📊 Step 2: Testing Data Provider');
    
    if (typeof window !== 'undefined' && window.getLatsProvider) {
      try {
        const provider = window.getLatsProvider();
        const result = await provider.getPurchaseOrders();
        
        if (result.ok && result.data) {
          console.log(`✅ Data provider returned ${result.data.length} orders`);
          
          result.data.forEach((order, index) => {
            console.log(`\n📦 Provider Order ${index + 1}: ${order.orderNumber}`);
            console.log('  Mapped Fields:');
            console.log('    - orderNumber:', order.orderNumber || '❌ MISSING');
            console.log('    - status:', order.status || '❌ MISSING');
            console.log('    - totalAmount:', order.totalAmount || '❌ MISSING');
            console.log('    - currency:', order.currency || '❌ MISSING');
            console.log('    - trackingNumber:', order.trackingNumber || '❌ MISSING');
            console.log('    - shippingStatus:', order.shippingStatus || '❌ MISSING');
            console.log('    - estimatedDelivery:', order.estimatedDelivery || '❌ MISSING');
            console.log('    - shippingNotes:', order.shippingNotes || '❌ MISSING');
            console.log('    - createdAt:', order.createdAt || '❌ MISSING');
            console.log('    - updatedAt:', order.updatedAt || '❌ MISSING');
            
            // Check shippingInfo object
            if (order.shippingInfo) {
              console.log('  ShippingInfo Object:');
              console.log('    - carrier:', order.shippingInfo.carrier || '❌ MISSING');
              console.log('    - trackingNumber:', order.shippingInfo.trackingNumber || '❌ MISSING');
              console.log('    - method:', order.shippingInfo.method || '❌ MISSING');
              console.log('    - notes:', order.shippingInfo.notes || '❌ MISSING');
              console.log('    - estimatedDelivery:', order.shippingInfo.estimatedDelivery || '❌ MISSING');
              console.log('    - shippedDate:', order.shippingInfo.shippedDate || '❌ MISSING');
              console.log('    - deliveredDate:', order.shippingInfo.deliveredDate || '❌ MISSING');
            } else {
              console.log('  ❌ NO SHIPPING INFO OBJECT');
            }
          });
        } else {
          console.error('❌ Data provider error:', result.message);
        }
      } catch (error) {
        console.error('❌ Data provider exception:', error);
      }
    } else {
      console.log('⚠️  Data provider not available');
    }

    // Check specific field mappings
    console.log('\n📊 Step 3: Field Mapping Analysis');
    
    if (rawOrders && rawOrders.length > 0) {
      const order = rawOrders[0]; // Use first order for analysis
      console.log(`🔍 Analyzing field mappings for: ${order.order_number}`);
      
      const fieldMappings = [
        { db: 'order_number', mapped: 'orderNumber' },
        { db: 'status', mapped: 'status' },
        { db: 'total_amount', mapped: 'totalAmount' },
        { db: 'currency', mapped: 'currency' },
        { db: 'tracking_number', mapped: 'trackingNumber' },
        { db: 'shipping_status', mapped: 'shippingStatus' },
        { db: 'estimated_delivery_date', mapped: 'estimatedDelivery' },
        { db: 'shipping_notes', mapped: 'shippingNotes' },
        { db: 'shipped_date', mapped: 'shippedDate' },
        { db: 'created_at', mapped: 'createdAt' },
        { db: 'updated_at', mapped: 'updatedAt' }
      ];
      
      fieldMappings.forEach(mapping => {
        const dbValue = order[mapping.db];
        const hasValue = dbValue !== null && dbValue !== undefined && dbValue !== '';
        console.log(`  ${mapping.db} → ${mapping.mapped}: ${hasValue ? '✅' : '❌'} (${dbValue || 'empty'})`);
      });
    }

    // Check for common issues
    console.log('\n📊 Step 4: Common Issues Check');
    
    if (rawOrders && rawOrders.length > 0) {
      const issues = [];
      
      rawOrders.forEach(order => {
        if (!order.tracking_number) issues.push(`${order.order_number}: Missing tracking_number`);
        if (!order.shipping_status) issues.push(`${order.order_number}: Missing shipping_status`);
        if (!order.shipped_date) issues.push(`${order.order_number}: Missing shipped_date`);
        if (!order.estimated_delivery_date) issues.push(`${order.order_number}: Missing estimated_delivery_date`);
        if (!order.shipping_notes) issues.push(`${order.order_number}: Missing shipping_notes`);
      });
      
      if (issues.length > 0) {
        console.log('❌ Issues Found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('✅ No common issues found');
      }
    }

    console.log('\n🎯 Diagnosis Complete!');
    console.log('📝 Check the output above to identify which fields are missing');

  } catch (error) {
    console.error('❌ Exception during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseMissingFields();
