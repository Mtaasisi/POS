#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPurchaseOrderPaymentsQuery() {
  try {
    console.log('🧪 Testing purchase_order_payments query with fixed syntax...');
    
    // Test the fixed query (without nested supplier data)
    const { data: poPayments, error: poError } = await supabase
      .from('purchase_order_payments')
      .select(`
        id, amount, status, payment_method, payment_date, reference, notes,
        lats_purchase_orders:purchase_order_id (order_number, supplier_id)
      `)
      .order('payment_date', { ascending: false })
      .limit(5);

    if (poError) {
      console.error('❌ Error testing purchase order payments query:', poError);
      console.error('Error details:', {
        message: poError.message,
        details: poError.details,
        hint: poError.hint,
        code: poError.code
      });
      return false;
    }

    console.log('✅ Purchase order payments query successful!');
    console.log(`📊 Found ${poPayments?.length || 0} purchase order payments`);
    
    if (poPayments && poPayments.length > 0) {
      console.log('📋 Sample payment data:');
      poPayments.forEach((payment, index) => {
        console.log(`  ${index + 1}. ID: ${payment.id}`);
        console.log(`     Amount: ${payment.amount}`);
        console.log(`     Status: ${payment.status}`);
        console.log(`     Method: ${payment.payment_method}`);
        console.log(`     Date: ${payment.payment_date}`);
        console.log(`     Order: ${payment.lats_purchase_orders?.order_number || 'N/A'}`);
        console.log(`     Supplier ID: ${payment.lats_purchase_orders?.supplier_id || 'N/A'}`);
        console.log('');
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting purchase order payments query test...');
  
  const success = await testPurchaseOrderPaymentsQuery();
  
  if (success) {
    console.log('✅ All tests passed! The 400 error should be resolved.');
  } else {
    console.log('❌ Tests failed. There may still be issues with the query.');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
