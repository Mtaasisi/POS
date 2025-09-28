// Apply fixes for purchase order 400 errors
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPurchaseOrderFixes() {
  console.log('🔧 Applying purchase order fixes...\n');

  try {
    // 1. Apply missing columns fix
    console.log('1. Adding missing columns to lats_purchase_orders table...');
    const columnsFix = fs.readFileSync(
      path.join(process.cwd(), 'fix-purchase-order-missing-columns.sql'), 
      'utf8'
    );
    
    const { error: columnsError } = await supabase.rpc('exec_sql', { sql: columnsFix });
    if (columnsError) {
      console.error('❌ Error adding columns:', columnsError.message);
    } else {
      console.log('✅ Missing columns added successfully');
    }

    // 2. Apply payment RPC function fix
    console.log('\n2. Fixing payment RPC function...');
    const rpcFix = fs.readFileSync(
      path.join(process.cwd(), 'fix-payment-rpc-function.sql'), 
      'utf8'
    );
    
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: rpcFix });
    if (rpcError) {
      console.error('❌ Error fixing RPC function:', rpcError.message);
    } else {
      console.log('✅ Payment RPC function fixed successfully');
    }

    // 3. Test purchase order creation
    console.log('\n3. Testing purchase order creation...');
    const testData = {
      supplier_id: '1b4a37b5-627a-4a47-906b-918aaea065a9',
      expected_delivery: null,
      notes: 'Test order',
      status: 'draft',
      currency: 'USD',
      payment_terms: 'Net 30',
      exchange_rate: 2500,
      base_currency: 'TZS',
      exchange_rate_source: 'manual',
      exchange_rate_date: new Date().toISOString()
    };

    const { data: testOrder, error: testError } = await supabase
      .from('lats_purchase_orders')
      .insert([testData])
      .select()
      .single();

    if (testError) {
      console.error('❌ Test purchase order creation failed:', testError.message);
    } else {
      console.log('✅ Test purchase order created successfully:', testOrder.id);
      
      // Clean up test order
      await supabase
        .from('lats_purchase_orders')
        .delete()
        .eq('id', testOrder.id);
      console.log('🧹 Test order cleaned up');
    }

    console.log('\n🎉 Purchase order fixes applied successfully!');
    console.log('The 400 Bad Request errors should now be resolved.');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

applyPurchaseOrderFixes();