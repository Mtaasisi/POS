// Clean script to create sample purchase orders with shipping information
// Run this in your browser console on the app page

async function createCleanSampleOrders() {
  console.log('🚢 Creating clean sample orders...');
  
  if (typeof window === 'undefined' || !window.supabase) {
    console.error('❌ Supabase client not found. Make sure you are on the app page.');
    return;
  }

  try {
    // First, get a supplier ID
    const { data: suppliers, error: supplierError } = await window.supabase
      .from('lats_suppliers')
      .select('id')
      .limit(1);
      
    if (supplierError || !suppliers || suppliers.length === 0) {
      console.error('❌ No suppliers found. Please create a supplier first.');
      return;
    }
    
    const supplierId = suppliers[0].id;
    console.log('✅ Using supplier ID:', supplierId);

    // Create one simple test order first
    const now = new Date();
    const orderDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)); // 5 days ago
    const shippedDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days ago
    const estimatedDelivery = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now

    console.log('📦 Creating test order...');
    
    const { data: order, error: orderError } = await window.supabase
      .from('lats_purchase_orders')
      .insert({
        order_number: 'PO-CLEAN-001',
        supplier_id: supplierId,
        status: 'shipped',
        expected_delivery: estimatedDelivery.toISOString(),
        shipped_date: shippedDate.toISOString(),
        total_amount: 100000.00,
        currency: 'TZS',
        payment_terms: 'Net 30',
        notes: 'Clean test order for shipping management',
        tracking_number: 'CLEAN123456789',
        shipping_status: 'shipped',
        estimated_delivery_date: estimatedDelivery.toISOString(),
        shipping_notes: 'Clean test shipping via DHL',
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
      return;
    }

    console.log('✅ Test order created:', order.order_number);

    // Create a second order
    const orderDate2 = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)); // 10 days ago
    const shippedDate2 = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
    const estimatedDelivery2 = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)); // 2 days ago

    const { data: order2, error: orderError2 } = await window.supabase
      .from('lats_purchase_orders')
      .insert({
        order_number: 'PO-CLEAN-002',
        supplier_id: supplierId,
        status: 'received',
        expected_delivery: estimatedDelivery2.toISOString(),
        shipped_date: shippedDate2.toISOString(),
        total_amount: 200000.00,
        currency: 'TZS',
        payment_terms: 'Net 15',
        notes: 'Clean delivered order',
        tracking_number: 'CLEAN987654321',
        shipping_status: 'delivered',
        estimated_delivery_date: estimatedDelivery2.toISOString(),
        shipping_notes: 'Clean delivered via FedEx',
        created_at: orderDate2.toISOString(),
        updated_at: orderDate2.toISOString()
      })
      .select()
      .single();

    if (orderError2) {
      console.error('❌ Error creating second order:', orderError2);
    } else {
      console.log('✅ Second order created:', order2.order_number);
    }

    console.log('🎉 Clean sample orders created successfully!');
    console.log('🚢 You can now view the shipping management page with sample data');
    console.log('📍 Navigate to: /lats/shipping');

    // Verify the data
    const { data: allOrders, error: verifyError } = await window.supabase
      .from('lats_purchase_orders')
      .select('order_number, status, tracking_number, shipping_status, total_amount')
      .like('order_number', 'PO-CLEAN-%')
      .order('created_at', { ascending: false });

    if (!verifyError && allOrders) {
      console.log('📋 Clean sample orders in database:');
      allOrders.forEach(order => {
        console.log(`  - ${order.order_number}: ${order.status} (${order.tracking_number})`);
      });
    }

  } catch (error) {
    console.error('❌ Exception creating clean sample orders:', error);
  }
}

// Run the function
createCleanSampleOrders();
