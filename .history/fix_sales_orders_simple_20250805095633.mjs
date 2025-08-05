import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSalesOrdersError() {
  try {
    console.log('🔧 Fixing sales_orders 400 error...');
    
    // Test if sales_orders table exists and is accessible
    console.log('📊 Testing sales_orders table access...');
    const { data: salesOrders, error: salesError } = await supabase
      .from('sales_orders')
      .select('*')
      .limit(1);
    
    if (salesError) {
      console.log('❌ sales_orders table error:', salesError.message);
    } else {
      console.log('✅ sales_orders table is accessible');
    }
    
    // Test if products table exists
    console.log('📊 Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.log('❌ products table error:', productsError.message);
    } else {
      console.log('✅ products table is accessible');
    }
    
    // Test if product_variants table exists
    console.log('📊 Testing product_variants table access...');
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .limit(1);
    
    if (variantsError) {
      console.log('❌ product_variants table error:', variantsError.message);
    } else {
      console.log('✅ product_variants table is accessible');
    }
    
    // Test if installment_payments table exists
    console.log('📊 Testing installment_payments table access...');
    const { data: payments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.log('❌ installment_payments table error:', paymentsError.message);
    } else {
      console.log('✅ installment_payments table is accessible');
    }
    
    // Test the full query that was causing the 400 error
    console.log('🔍 Testing the problematic query...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('sales_orders')
        .select(`
          *,
          sales_order_items(
            *,
            product:products(name, brand, model, description, images),
            variant:product_variants(variant_name, sku, attributes)
          ),
          installment_payments(*),
          created_by_user:auth_users(id, name, email)
        `)
        .limit(1);
      
      if (testError) {
        console.log('❌ Full query still has issues:', testError.message);
        console.log('💡 This suggests missing tables or incorrect references');
      } else {
        console.log('✅ Full query is now working!');
      }
    } catch (error) {
      console.log('❌ Full query failed:', error.message);
    }
    
    console.log('✅ Sales orders error fix completed!');
    console.log('📝 If tables are missing, you may need to run the SQL script in your Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixSalesOrdersError(); 