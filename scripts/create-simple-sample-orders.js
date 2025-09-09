// Simple script to create sample purchase orders with shipping information
// Run this in your browser console on the app page

async function createSimpleSampleOrders() {
  console.log('🚢 Creating simple sample orders...');
  
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

    // Sample orders data
    const sampleOrders = [
      {
        order_number: 'PO-SAMPLE-001',
        status: 'shipped',
        tracking_number: 'DHL123456789',
        shipping_status: 'shipped',
        total_amount: 150000.00,
        carrier: 'DHL Express',
        days_ago: 5,
        estimated_days: 2
      },
      {
        order_number: 'PO-SAMPLE-002',
        status: 'received',
        tracking_number: 'FEDEX987654321',
        shipping_status: 'delivered',
        total_amount: 250000.00,
        carrier: 'FedEx',
        days_ago: 10,
        estimated_days: -2
      },
      {
        order_number: 'PO-SAMPLE-003',
        status: 'shipped',
        tracking_number: 'UPS456789123',
        shipping_status: 'shipped',
        total_amount: 75000.00,
        carrier: 'UPS',
        days_ago: 3,
        estimated_days: 4
      }
    ];

    const createdOrders = [];

    // Create each sample order
    for (const orderData of sampleOrders) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - orderData.days_ago);
      
      const shippedDate = new Date();
      shippedDate.setDate(shippedDate.getDate() - (orderData.days_ago - 2));
      
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + orderData.estimated_days);

      console.log(`📦 Creating order: ${orderData.order_number}`);

      const { data: order, error: orderError } = await window.supabase
        .from('lats_purchase_orders')
        .insert({
          order_number: orderData.order_number,
          supplier_id: supplierId,
          status: orderData.status,
          expected_delivery: estimatedDelivery.toISOString(),
          shipped_date: shippedDate.toISOString(),
          total_amount: orderData.total_amount,
          currency: 'TZS',
          payment_terms: 'Net 30',
          notes: `Sample order for testing shipping management - ${orderData.carrier}`,
          tracking_number: orderData.tracking_number,
          shipping_status: orderData.shipping_status,
          estimated_delivery_date: estimatedDelivery.toISOString(),
          shipping_notes: `Sample shipping via ${orderData.carrier}`,
          created_at: orderDate.toISOString(),
          updated_at: orderDate.toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error(`❌ Error creating order ${orderData.order_number}:`, orderError);
        continue;
      }

      console.log(`✅ Created order: ${orderData.order_number}`);
      createdOrders.push(order);
    }

    console.log('🎉 Sample orders created successfully!');
    console.log('📊 Created orders:', createdOrders.length);
    console.log('🚢 You can now view the shipping management page with sample data');
    console.log('📍 Navigate to: /lats/shipping');

    // Verify the data
    const { data: allOrders, error: verifyError } = await window.supabase
      .from('lats_purchase_orders')
      .select('order_number, status, tracking_number, shipping_status, total_amount')
      .like('order_number', 'PO-SAMPLE-%')
      .order('created_at', { ascending: false });

    if (!verifyError && allOrders) {
      console.log('📋 Sample orders in database:');
      allOrders.forEach(order => {
        console.log(`  - ${order.order_number}: ${order.status} (${order.tracking_number})`);
      });
    }

  } catch (error) {
    console.error('❌ Exception creating sample orders:', error);
  }
}

// Run the function
createSimpleSampleOrders();
