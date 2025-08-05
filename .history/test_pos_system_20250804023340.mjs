import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPOSSystem() {
  console.log('🧪 Testing POS System Components...\n');

  try {
    // Test 1: Check if tables exist
    console.log('📊 Testing Database Tables...');
    
    const tables = [
      'sales_orders',
      'sales_order_items', 
      'product_variants',
      'locations',
      'loyalty_customers',
      'installment_payments'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Test 2: Check if we have sample data
    console.log('\n📋 Checking Sample Data...');
    
    // Check customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.log('❌ customers table:', customersError.message);
    } else {
      console.log(`✅ customers: ${customers?.length || 0} found`);
    }

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.log('❌ products table:', productsError.message);
    } else {
      console.log(`✅ products: ${products?.length || 0} found`);
    }

    // Check locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5);
    
    if (locationsError) {
      console.log('❌ locations table:', locationsError.message);
    } else {
      console.log(`✅ locations: ${locations?.length || 0} found`);
    }

    // Test 3: Test creating a sample order (if we have data)
    console.log('\n🛒 Testing Order Creation...');
    
    if (customers && customers.length > 0 && products && products.length > 0) {
      try {
        // Get first customer and product
        const testCustomer = customers[0];
        const testProduct = products[0];
        
        console.log(`📝 Testing with customer: ${testCustomer.name}`);
        console.log(`📦 Testing with product: ${testProduct.name}`);
        
        // Create a test order
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .insert([{
            customer_id: testCustomer.id,
            total_amount: 1000,
            tax_amount: 160,
            shipping_cost: 0,
            final_amount: 1160,
            amount_paid: 1160,
            balance_due: 0,
            payment_method: 'card',
            customer_type: 'retail',
            status: 'completed',
            created_by: 'test-user'
          }])
          .select()
          .single();
        
        if (orderError) {
          console.log('❌ Order creation failed:', orderError.message);
        } else {
          console.log('✅ Test order created successfully');
          
          // Clean up test order
          await supabase
            .from('sales_orders')
            .delete()
            .eq('id', order.id);
          
          console.log('🧹 Test order cleaned up');
        }
      } catch (err) {
        console.log('❌ Order test failed:', err.message);
      }
    } else {
      console.log('⚠️  Need sample data to test order creation');
    }

    console.log('\n🎉 POS System Test Completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add sample products and customers if needed');
    console.log('2. Test the POS interface at http://localhost:5175/pos');
    console.log('3. Monitor browser console for any errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPOSSystem(); 