import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkShippingData() {
  console.log('🔍 Checking current shipping data for TRK32501039OYAV...\n');
  
  try {
    const { data, error } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        carrier:lats_shipping_carriers(id, name, code, tracking_url),
        agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email),
        manager:lats_shipping_managers(id, name, department, phone, email)
      `)
      .eq('tracking_number', 'TRK32501039OYAV')
      .single();
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Current shipping data:');
    console.log('   ID:', data.id);
    console.log('   Tracking Number:', data.tracking_number);
    console.log('   Status:', data.status);
    console.log('   Carrier:', data.carrier?.name || 'None');
    console.log('   Agent:', data.agent?.name || 'None');
    console.log('   Manager:', data.manager?.name || 'None');
    console.log('   Cost:', data.cost);
    console.log('   Estimated Delivery:', data.estimated_delivery);
    console.log('   Shipping Origin:', data.shipping_origin);
    console.log('   Shipping Destination:', data.shipping_destination);
    
    // Also check the purchase order ID
    console.log('\n🔍 Checking purchase order data...');
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .eq('id', data.purchase_order_id)
      .single();
      
    if (poError) {
      console.error('❌ Error fetching purchase order:', poError);
    } else {
      console.log('✅ Purchase Order:', poData.order_number, 'Status:', poData.status);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkShippingData();
