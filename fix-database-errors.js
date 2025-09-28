import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔧 Fixing database errors...');
console.log('🌐 Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseErrors() {
  try {
    console.log('\n📋 Step 1: Testing current queries...');
    
    // Test the failing query from PaymentsContext
    console.log('🔍 Testing PaymentsContext query...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name),
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentsError) {
      console.log('❌ PaymentsContext query failed:', paymentsError.message);
      
      // Try simpler query
      console.log('🔄 Trying simpler query...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('lats_sales')
        .select('*')
        .limit(1);
        
      if (simpleError) {
        console.log('❌ Even simple query failed:', simpleError.message);
      } else {
        console.log('✅ Simple query works, found', simpleData?.length || 0, 'sales');
      }
    } else {
      console.log('✅ PaymentsContext query works, found', paymentsData?.length || 0, 'sales');
    }

    // Test provider query
    console.log('\n🔍 Testing provider query...');
    const { data: providerData, error: providerError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1);

    if (providerError) {
      console.log('❌ Provider query failed:', providerError.message);
    } else {
      console.log('✅ Provider query works, found', providerData?.length || 0, 'sales');
    }

    console.log('\n📋 Step 2: Checking table existence...');
    
    // Check if customers table exists
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
      
    if (customersError) {
      console.log('❌ Customers table issue:', customersError.message);
    } else {
      console.log('✅ Customers table exists, found', customersData?.length || 0, 'customers');
    }

    // Check if lats_sale_items table exists
    const { data: saleItemsData, error: saleItemsError } = await supabase
      .from('lats_sale_items')
      .select('id')
      .limit(1);
      
    if (saleItemsError) {
      console.log('❌ lats_sale_items table issue:', saleItemsError.message);
    } else {
      console.log('✅ lats_sale_items table exists, found', saleItemsData?.length || 0, 'items');
    }

    // Check if lats_products table exists
    const { data: productsData, error: productsError } = await supabase
      .from('lats_products')
      .select('id')
      .limit(1);
      
    if (productsError) {
      console.log('❌ lats_products table issue:', productsError.message);
    } else {
      console.log('✅ lats_products table exists, found', productsData?.length || 0, 'products');
    }

    // Check if lats_product_variants table exists
    const { data: variantsData, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id')
      .limit(1);
      
    if (variantsError) {
      console.log('❌ lats_product_variants table issue:', variantsError.message);
    } else {
      console.log('✅ lats_product_variants table exists, found', variantsData?.length || 0, 'variants');
    }

    console.log('\n📋 Step 3: Summary and recommendations...');
    
    if (paymentsError || providerError) {
      console.log('🔧 ISSUE IDENTIFIED: The complex queries are failing due to missing tables or relationships.');
      console.log('💡 SOLUTION: You need to run the comprehensive-database-fix.sql file in your Supabase dashboard.');
      console.log('📝 The SQL file will:');
      console.log('   - Create missing tables (customers, lats_sale_items)');
      console.log('   - Add missing columns to existing tables');
      console.log('   - Set up proper foreign key relationships');
      console.log('   - Create RLS policies');
      console.log('   - Add performance indexes');
      console.log('\n🚀 To fix this:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the contents of comprehensive-database-fix.sql');
      console.log('   4. Run the SQL script');
      console.log('   5. Refresh your application');
    } else {
      console.log('✅ All queries are working correctly!');
      console.log('🎉 No database fixes needed.');
    }

  } catch (error) {
    console.error('💥 Error during database check:', error.message);
  }
}

// Run the check
fixDatabaseErrors().catch(console.error);
