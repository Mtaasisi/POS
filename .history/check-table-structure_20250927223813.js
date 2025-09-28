import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structures...');
  
  try {
    // Check lats_purchase_order_items structure
    console.log('📝 Checking lats_purchase_order_items structure...');
    const { data: poiData, error: poiError } = await supabase
      .from('lats_purchase_order_items')
      .select('*')
      .limit(1);
    
    if (poiError) {
      console.log(`❌ lats_purchase_order_items error: ${poiError.message}`);
    } else {
      console.log('✅ lats_purchase_order_items columns:', Object.keys(poiData[0] || {}));
    }
    
    // Check inventory_items structure
    console.log('📝 Checking inventory_items structure...');
    const { data: invData, error: invError } = await supabase
      .from('inventory_items')
      .select('*')
      .limit(1);
    
    if (invError) {
      console.log(`❌ inventory_items error: ${invError.message}`);
    } else {
      console.log('✅ inventory_items columns:', Object.keys(invData[0] || {}));
    }
    
    // Check lats_inventory_adjustments structure
    console.log('📝 Checking lats_inventory_adjustments structure...');
    const { data: adjData, error: adjError } = await supabase
      .from('lats_inventory_adjustments')
      .select('*')
      .limit(1);
    
    if (adjError) {
      console.log(`❌ lats_inventory_adjustments error: ${adjError.message}`);
    } else {
      console.log('✅ lats_inventory_adjustments columns:', Object.keys(adjData[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkTableStructure();
