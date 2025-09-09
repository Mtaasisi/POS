// Script to create sample purchase orders with shipping information
// Run this in your browser console to populate the shipping management page

async function createSampleShippedOrders() {
  console.log('🚢 Creating sample shipped orders...');
  
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

    // Get a product ID
    const { data: products, error: productError } = await window.supabase
      .from('lats_products')
      .select('id')
      .limit(1);
      
    if (productError || !products || products.length === 0) {
      console.error('❌ No products found. Please create a product first.');
      return;
    }
    
    const productId = products[0].id;
    console.log('✅ Using product ID:', productId);

    // Get a product variant ID
    const { data: variants, error: variantError } = await window.supabase
      .from('lats_product_variants')
      .select('id')
      .limit(1);
      
    if (variantError || !variants || variants.length === 0) {
      console.error('❌ No product variants found. Please create a product variant first.');
      return;
    }
    
    const variantId = variants[0].id;
    console.log('✅ Using variant ID:', variantId);

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
      },
      {
        order_number: 'PO-SAMPLE-004',
        status: 'shipped',
        tracking_number: 'MAERSK789123456',
        shipping_status: 'shipped',
        total_amount: 500000.00,
        carrier: 'Maersk Line',
        days_ago: 15,
        estimated_days: -3 // Overdue
      },
      {
        order_number: 'PO-SAMPLE-005',
        status: 'received',
        tracking_number: 'TED321654987',
        shipping_status: 'delivered',
        total_amount: 120000.00,
        carrier: 'Tanzania Express Delivery',
        days_ago: 7,
        estimated_days: -1
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

      const { data: order, error: orderError } = await window.supabase
        .from('lats_purchase_orders')
        .insert({
          order_number: orderData.order_number,
          supplier_id: supplierId,
          status: orderData.status,
          expected_delivery_date: estimatedDelivery.toISOString(),
          shipped_date: shippedDate.toISOString(),
          total_amount: orderData.total_amount,
          currency: 'TZS',
          payment_terms: 'Net 30',
          notes: `Sample order for testing shipping management - ${orderData.carrier}`,
          tracking_number: orderData.tracking_number,
          shipping_status: orderData.shipping_status,
          estimated_delivery: estimatedDelivery.toISOString(),
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

      // Add items to the order
      const { error: itemError } = await window.supabase
        .from('lats_purchase_order_items')
        .insert({
          purchase_order_id: order.id,
          product_id: productId,
          variant_id: variantId,
          quantity: Math.floor(orderData.total_amount / 75000) || 1,
          cost_price: orderData.total_amount / (Math.floor(orderData.total_amount / 75000) || 1),
          total_price: orderData.total_amount,
          notes: 'Sample item for testing'
        });

      if (itemError) {
        console.error(`❌ Error adding items to order ${orderData.order_number}:`, itemError);
      } else {
        console.log(`✅ Added items to order: ${orderData.order_number}`);
      }

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
      .order('order_date', { ascending: false });

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
createSampleShippedOrders();
