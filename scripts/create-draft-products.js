// Script to manually create draft products for testing
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDraftProductsForShipment(shippingId) {
  try {
    console.log('🔍 Looking for shipping info:', shippingId);
    
    // Get shipping info with purchase order
    const { data: shippingInfo, error: shippingError } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        purchase_order:lats_purchase_orders(
          id,
          items:lats_purchase_order_items(
            *,
            product:lats_products(*)
          )
        )
      `)
      .eq('id', shippingId)
      .single();

    if (shippingError) {
      console.error('❌ Error fetching shipping info:', shippingError);
      return;
    }

    if (!shippingInfo) {
      console.error('❌ No shipping info found');
      return;
    }

    console.log('✅ Found shipping info:', {
      id: shippingInfo.id,
      trackingNumber: shippingInfo.tracking_number,
      purchaseOrderId: shippingInfo.purchase_order_id
    });

    if (!shippingInfo.purchase_order) {
      console.error('❌ No purchase order found');
      return;
    }

    console.log('📦 Purchase order items:', shippingInfo.purchase_order.items?.length || 0);

    // Create draft products for each purchase order item
    for (const item of shippingInfo.purchase_order.items || []) {
      console.log('🔄 Processing item:', item.id);
      
      // Check if draft product already exists
      const { data: existingCargoItem } = await supabase
        .from('lats_shipping_cargo_items')
        .select('*')
        .eq('shipping_id', shippingId)
        .eq('product_id', item.product_id)
        .single();

      if (existingCargoItem) {
        console.log('⏭️  Draft product already exists for item:', item.id);
        continue;
      }

      // Create draft product if it doesn't exist
      if (item.product) {
        // Update product to draft status
        const { error: updateError } = await supabase
          .from('lats_products')
          .update({ status: 'draft' })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('❌ Error updating product status:', updateError);
          continue;
        }

        // Create cargo item
        const { error: cargoError } = await supabase
          .from('lats_shipping_cargo_items')
          .insert({
            shipping_id: shippingId,
            product_id: item.product_id,
            purchase_order_item_id: item.id,
            quantity: item.quantity,
            cost_price: item.cost_price,
            description: item.product.name || 'Product from PO'
          });

        if (cargoError) {
          console.error('❌ Error creating cargo item:', cargoError);
        } else {
          console.log('✅ Created draft product for:', item.product.name);
        }
      } else {
        console.log('⚠️  No product found for item:', item.id);
      }
    }

    console.log('🎉 Draft products creation completed!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get shipping ID from command line argument
const shippingId = process.argv[2];

if (!shippingId) {
  console.log('Usage: node create-draft-products.js <shipping-id>');
  console.log('Example: node create-draft-products.js 38aeb0a4-cc4d-418e-9b00-bf556c7ab04a');
  process.exit(1);
}

createDraftProductsForShipment(shippingId);
