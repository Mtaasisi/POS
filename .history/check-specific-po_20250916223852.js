import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificPurchaseOrder() {
  console.log('🔍 Checking Purchase Order: PO-1757764362.924445\n');
  
  try {
    // First, search by order number
    const { data: ordersByNumber, error: numberError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('order_number', 'PO-1757764362.924445');
    
    if (numberError) {
      console.error('❌ Error searching by order number:', numberError);
    } else if (ordersByNumber && ordersByNumber.length > 0) {
      console.log('✅ Found purchase order by order number:');
      const order = ordersByNumber[0];
      console.log('📋 Order Details:');
      console.log(`   ID: ${order.id}`);
      console.log(`   Order Number: ${order.order_number}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Updated: ${order.updated_at}`);
      console.log(`   Expected Delivery: ${order.expected_delivery || 'Not set'}`);
      console.log(`   Currency: ${order.currency}`);
      console.log(`   Exchange Rate: ${order.exchange_rate}`);
      console.log(`   Total Amount: ${order.total_amount}`);
      console.log(`   Notes: ${order.notes || 'No notes'}`);
      console.log(`   Supplier ID: ${order.supplier_id}`);
      console.log('');
      
      // Get supplier details
      if (order.supplier_id) {
        const { data: supplier, error: supplierError } = await supabase
          .from('lats_suppliers')
          .select('*')
          .eq('id', order.supplier_id)
          .single();
        
        if (supplierError) {
          console.error('❌ Error fetching supplier:', supplierError);
        } else if (supplier) {
          console.log('🏢 Supplier Details:');
          console.log(`   Name: ${supplier.name}`);
          console.log(`   Contact: ${supplier.contact_person || 'N/A'}`);
          console.log(`   Phone: ${supplier.phone || 'N/A'}`);
          console.log(`   Email: ${supplier.email || 'N/A'}`);
          console.log('');
        }
      }
      
      // Get purchase order items
      const { data: items, error: itemsError } = await supabase
        .from('lats_purchase_order_items')
        .select(`
          *,
          lats_products(name, sku),
          lats_spare_part_variants(name, sku)
        `)
        .eq('purchase_order_id', order.id);
      
      if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
      } else if (items && items.length > 0) {
        console.log(`📦 Items (${items.length}):`);
        let totalQuantity = 0;
        let totalReceived = 0;
        
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.lats_products?.name || item.lats_spare_part_variants?.name || 'Unknown Product'}`);
          console.log(`      SKU: ${item.lats_products?.sku || item.lats_spare_part_variants?.sku || 'N/A'}`);
          console.log(`      Quantity: ${item.quantity}`);
          console.log(`      Received: ${item.received_quantity || 0}`);
          console.log(`      Unit Price: ${item.unit_price}`);
          console.log(`      Total Price: ${item.total_price}`);
          console.log('');
          
          totalQuantity += item.quantity || 0;
          totalReceived += item.received_quantity || 0;
        });
        
        console.log('📊 Summary:');
        console.log(`   Items Count: ${items.length}`);
        console.log(`   Total Quantity: ${totalQuantity}`);
        console.log(`   Total Received: ${totalReceived}`);
        console.log(`   Total Amount: ${order.total_amount}`);
        
        // Calculate TZS equivalent
        if (order.exchange_rate && order.total_amount) {
          const tzsEquivalent = order.total_amount * order.exchange_rate;
          console.log(`   TZS Equivalent: TZS ${tzsEquivalent.toLocaleString()}`);
          console.log(`   Exchange Rate: 1 ${order.currency} = ${order.exchange_rate} TZS`);
        }
      } else {
        console.log('📭 No items found for this purchase order');
      }
      
    } else {
      console.log('❌ Purchase order not found by order number');
      
      // Try to find similar order numbers
      const { data: similarOrders, error: similarError } = await supabase
        .from('lats_purchase_orders')
        .select('order_number, id, status, created_at')
        .ilike('order_number', '%1757764362%')
        .limit(5);
      
      if (similarError) {
        console.error('❌ Error searching for similar orders:', similarError);
      } else if (similarOrders && similarOrders.length > 0) {
        console.log('🔍 Found similar order numbers:');
        similarOrders.forEach(order => {
          console.log(`   - ${order.order_number} (${order.status}) - ${order.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSpecificPurchaseOrder().catch(console.error);
