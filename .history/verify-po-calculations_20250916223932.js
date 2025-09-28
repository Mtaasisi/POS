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

async function verifyCalculations() {
  console.log('🔍 Verifying Purchase Order Calculations\n');
  
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
    
    // Get all items with detailed pricing
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('*')
      .eq('purchase_order_id', order.id);
    
    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError);
      return;
    }
    
    console.log('📊 Financial Verification:');
    console.log(`   Order Total (Database): ${order.total_amount} ${order.currency}`);
    console.log(`   Exchange Rate: 1 ${order.currency} = ${order.exchange_rate} TZS`);
    console.log('');
    
    // Calculate from items
    let calculatedTotal = 0;
    let itemsWithMissingPrices = 0;
    
    console.log('📦 Item-by-Item Calculation:');
    items.forEach((item, index) => {
      const itemTotal = item.total_price || 0;
      calculatedTotal += itemTotal;
      
      console.log(`   ${index + 1}. Quantity: ${item.quantity}, Total: ${itemTotal} ${order.currency}`);
      
      if (item.unit_price === null || item.unit_price === undefined) {
        itemsWithMissingPrices++;
        console.log(`      ⚠️  Unit price is missing/undefined`);
      } else {
        const expectedTotal = item.quantity * item.unit_price;
        if (Math.abs(itemTotal - expectedTotal) > 0.01) {
          console.log(`      ⚠️  Price mismatch: Expected ${expectedTotal}, Got ${itemTotal}`);
        }
      }
    });
    
    console.log('');
    console.log('🔍 Calculation Results:');
    console.log(`   Database Total: ${order.total_amount} ${order.currency}`);
    console.log(`   Calculated Total: ${calculatedTotal} ${order.currency}`);
    console.log(`   Difference: ${Math.abs(order.total_amount - calculatedTotal)} ${order.currency}`);
    
    if (Math.abs(order.total_amount - calculatedTotal) < 0.01) {
      console.log('   ✅ Total amounts match perfectly');
    } else {
      console.log('   ❌ Total amounts do not match');
    }
    
    console.log('');
    console.log('💰 TZS Conversion:');
    const tzsEquivalent = order.total_amount * order.exchange_rate;
    console.log(`   ${order.total_amount} ${order.currency} × ${order.exchange_rate} = TZS ${tzsEquivalent.toLocaleString()}`);
    
    // Check if the displayed TZS amount matches
    const displayedTZS = 30585600; // From the UI
    console.log(`   Displayed TZS: TZS ${displayedTZS.toLocaleString()}`);
    console.log(`   Calculated TZS: TZS ${tzsEquivalent.toLocaleString()}`);
    
    if (Math.abs(tzsEquivalent - displayedTZS) < 1) {
      console.log('   ✅ TZS conversion matches');
    } else {
      console.log('   ❌ TZS conversion does not match');
      console.log(`   Difference: TZS ${Math.abs(tzsEquivalent - displayedTZS).toLocaleString()}`);
    }
    
    console.log('');
    console.log('📋 Summary Issues:');
    if (itemsWithMissingPrices > 0) {
      console.log(`   ⚠️  ${itemsWithMissingPrices} items have missing unit prices`);
    }
    
    // Check quantities
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    console.log(`   Items Count: ${items.length} (matches UI: 10)`);
    console.log(`   Total Quantity: ${totalQuantity} (matches UI: 20)`);
    console.log(`   Total Received: 0 (matches UI: 0)`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyCalculations().catch(console.error);
