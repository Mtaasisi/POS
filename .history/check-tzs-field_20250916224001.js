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

async function checkTZSField() {
  console.log('🔍 Checking TZS Base Currency Field\n');
  
  try {
    // Get the purchase order with all fields
    const { data: order, error: orderError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('order_number', 'PO-1757764362.924445')
      .single();
    
    if (orderError || !order) {
      console.error('❌ Error fetching purchase order:', orderError);
      return;
    }
    
    console.log('📊 All Purchase Order Fields:');
    Object.keys(order).forEach(key => {
      console.log(`   ${key}: ${order[key]}`);
    });
    
    console.log('\n🔍 TZS Calculation Analysis:');
    console.log(`   total_amount: ${order.total_amount}`);
    console.log(`   exchange_rate: ${order.exchange_rate}`);
    console.log(`   total_amount_base_currency: ${order.total_amount_base_currency}`);
    console.log(`   currency: ${order.currency}`);
    
    if (order.total_amount_base_currency) {
      console.log(`\n💰 TZS Equivalent from Database: TZS ${order.total_amount_base_currency.toLocaleString()}`);
      console.log(`   Calculated: ${order.total_amount} × ${order.exchange_rate} = TZS ${(order.total_amount * order.exchange_rate).toLocaleString()}`);
      
      const difference = Math.abs(order.total_amount_base_currency - (order.total_amount * order.exchange_rate));
      console.log(`   Difference: TZS ${difference.toLocaleString()}`);
      
      if (difference < 1) {
        console.log('   ✅ Values match');
      } else {
        console.log('   ❌ Values do not match');
        
        // Check if it might be using a different exchange rate
        const possibleRate = order.total_amount_base_currency / order.total_amount;
        console.log(`   Possible exchange rate used: ${possibleRate}`);
      }
    } else {
      console.log('\n❌ total_amount_base_currency is null/undefined');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTZSField().catch(console.error);
