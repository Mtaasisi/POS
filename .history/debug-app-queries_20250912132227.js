// Debug script to test the exact queries used by the application
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAppQueries() {
  console.log('🔍 Testing exact application queries...\n');

  try {
    // 1. Test the getProducts query (similar to what the app uses)
    console.log('1. Testing getProducts query...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_suppliers(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (productsError) {
      console.log('❌ Error in getProducts query:', productsError);
    } else {
      console.log(`✅ getProducts query successful: ${products.length} products`);
      if (products.length > 0) {
        console.log('   First product:', products[0].name);
      }
    }

    // 2. Test the getProduct query for the specific product
    console.log('\n2. Testing getProduct query for iMac...');
    const productId = '65b6d2e0-9300-42d6-b8d5-8b5bbed759c1';
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(id, name, description, color, created_at, updated_at),
        lats_suppliers(
          id, name, contact_person, email, phone, address, website, notes, 
          created_at, updated_at
        )
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.log('❌ Error in getProduct query:', productError);
    } else {
      console.log(`✅ getProduct query successful: ${product.name}`);
      console.log('   Category:', product.lats_categories?.name || 'No category');
      console.log('   Supplier:', product.lats_suppliers?.name || 'No supplier');
    }

    // 3. Test product variants query
    console.log('\n3. Testing product variants query...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', productId);

    if (variantsError) {
      console.log('❌ Error in variants query:', variantsError);
    } else {
      console.log(`✅ Variants query successful: ${variants.length} variants`);
      variants.forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.name} - Qty: ${variant.quantity}`);
      });
    }

    // 4. Test stock movements query
    console.log('\n4. Testing stock movements query...');
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (stockError) {
      console.log('❌ Error in stock movements query:', stockError);
    } else {
      console.log(`✅ Stock movements query successful: ${stockMovements.length} movements`);
    }

    // 5. Test categories query
    console.log('\n5. Testing categories query...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*')
      .order('name', { ascending: true });

    if (categoriesError) {
      console.log('❌ Error in categories query:', categoriesError);
    } else {
      console.log(`✅ Categories query successful: ${categories.length} categories`);
    }

    // 6. Test suppliers query
    console.log('\n6. Testing suppliers query...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (suppliersError) {
      console.log('❌ Error in suppliers query:', suppliersError);
    } else {
      console.log(`✅ Suppliers query successful: ${suppliers.length} suppliers`);
    }

    // 7. Test authentication status
    console.log('\n7. Testing authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('⚠️ No user authenticated (anonymous access)');
    }

    // 8. Test RLS policies by checking if we can access data without authentication
    console.log('\n8. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('lats_products')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.log('❌ RLS policy blocking access:', rlsError.message);
    } else {
      console.log('✅ RLS policies allow access to products');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugAppQueries().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
