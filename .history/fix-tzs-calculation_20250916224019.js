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

async function fixTZSCalculation() {
  console.log('🔧 Fixing TZS Calculation for PO-1757764362.924445\n');
  
  try {
    // Get the purchase order
    const { data: order, error: orderError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('order_number', 'PO-1757764362.924445')
      .single();
    
    if (orderError || !order) {
      console.error('❌ Error fetching purchase order:', orderError);
      return;
    }
    
    console.log('📊 Current Values:');
    console.log(`   Total Amount: ${order.total_amount} ${order.currency}`);
    console.log(`   Exchange Rate: ${order.exchange_rate}`);
    console.log(`   Current TZS Base Currency: ${order.total_amount_base_currency}`);
    
    // Calculate correct TZS equivalent
    const correctTZSAmount = order.total_amount * order.exchange_rate;
    console.log(`   Correct TZS Amount: ${correctTZSAmount.toLocaleString()}`);
    
    console.log('\n🔧 Updating TZS Base Currency...');
    
    // Update the total_amount_base_currency field
    const { data: updatedOrder, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update({
        total_amount_base_currency: correctTZSAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating purchase order:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated TZS calculation!');
    console.log('\n📊 Updated Values:');
    console.log(`   Total Amount: ${updatedOrder.total_amount} ${updatedOrder.currency}`);
    console.log(`   Exchange Rate: ${updatedOrder.exchange_rate}`);
    console.log(`   TZS Base Currency: ${updatedOrder.total_amount_base_currency.toLocaleString()}`);
    
    // Verify the calculation
    const verification = updatedOrder.total_amount * updatedOrder.exchange_rate;
    console.log(`   Verification: ${updatedOrder.total_amount} × ${updatedOrder.exchange_rate} = ${verification.toLocaleString()}`);
    
    if (Math.abs(updatedOrder.total_amount_base_currency - verification) < 1) {
      console.log('   ✅ Calculation is now correct!');
    } else {
      console.log('   ❌ Calculation still incorrect');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixTZSCalculation().catch(console.error);
