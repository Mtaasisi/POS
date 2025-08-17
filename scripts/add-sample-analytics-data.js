const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleAnalyticsData() {
  console.log('📦 Adding sample analytics data...\n');

  try {
    // Step 1: Add sample categories
    console.log('📂 Step 1: Adding categories...');
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Books', description: 'Books and publications' }
    ];

    const { data: insertedCategories, error: categoriesError } = await supabase
      .from('lats_categories')
      .insert(categories)
      .select();

    if (categoriesError) {
      console.error('❌ Error adding categories:', categoriesError);
      return;
    }

    console.log(`✅ Added ${insertedCategories?.length || 0} categories`);

    // Step 2: Add sample brands
    console.log('\n🏷️ Step 2: Adding brands...');
    const brands = [
      { name: 'Apple', description: 'Premium electronics brand' },
      { name: 'Nike', description: 'Sports and athletic wear' },
      { name: 'Penguin', description: 'Book publisher' }
    ];

    const { data: insertedBrands, error: brandsError } = await supabase
      .from('lats_brands')
      .insert(brands)
      .select();

    if (brandsError) {
      console.error('❌ Error adding brands:', brandsError);
      return;
    }

    console.log(`✅ Added ${insertedBrands?.length || 0} brands`);

    // Step 3: Add sample suppliers
    console.log('\n🏢 Step 3: Adding suppliers...');
    const suppliers = [
      { name: 'Tech Supplies Inc', contact_person: 'John Doe', email: 'john@techsupplies.com' },
      { name: 'Fashion Wholesale', contact_person: 'Jane Smith', email: 'jane@fashionwholesale.com' },
      { name: 'Book Distributors', contact_person: 'Bob Johnson', email: 'bob@bookdistributors.com' }
    ];

    const { data: insertedSuppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .insert(suppliers)
      .select();

    if (suppliersError) {
      console.error('❌ Error adding suppliers:', suppliersError);
      return;
    }

    console.log(`✅ Added ${insertedSuppliers?.length || 0} suppliers`);

    // Step 4: Add sample products
    console.log('\n📦 Step 4: Adding products...');
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features',
        category_id: insertedCategories[0].id,
        brand_id: insertedBrands[0].id,
        supplier_id: insertedSuppliers[0].id,
        is_active: true,
        total_quantity: 50,
        total_value: 50000.00
      },
      {
        name: 'Nike Air Max',
        description: 'Comfortable running shoes',
        category_id: insertedCategories[1].id,
        brand_id: insertedBrands[1].id,
        supplier_id: insertedSuppliers[1].id,
        is_active: true,
        total_quantity: 100,
        total_value: 15000.00
      },
      {
        name: 'The Great Gatsby',
        description: 'Classic novel by F. Scott Fitzgerald',
        category_id: insertedCategories[2].id,
        brand_id: insertedBrands[2].id,
        supplier_id: insertedSuppliers[2].id,
        is_active: true,
        total_quantity: 200,
        total_value: 2000.00
      }
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from('lats_products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('❌ Error adding products:', productsError);
      return;
    }

    console.log(`✅ Added ${insertedProducts?.length || 0} products`);

    // Step 5: Add sample variants
    console.log('\n🏷️ Step 5: Adding product variants...');
    const variants = [
      // iPhone variants
      {
        product_id: insertedProducts[0].id,
        sku: 'IPHONE-15-PRO-128',
        name: 'iPhone 15 Pro 128GB',
        cost_price: 800.00,
        selling_price: 999.00,
        quantity: 20,
        min_quantity: 5
      },
      {
        product_id: insertedProducts[0].id,
        sku: 'IPHONE-15-PRO-256',
        name: 'iPhone 15 Pro 256GB',
        cost_price: 900.00,
        selling_price: 1099.00,
        quantity: 15,
        min_quantity: 5
      },
      {
        product_id: insertedProducts[0].id,
        sku: 'IPHONE-15-PRO-512',
        name: 'iPhone 15 Pro 512GB',
        cost_price: 1100.00,
        selling_price: 1299.00,
        quantity: 15,
        min_quantity: 5
      },
      // Nike variants
      {
        product_id: insertedProducts[1].id,
        sku: 'NIKE-AIR-MAX-8',
        name: 'Nike Air Max Size 8',
        cost_price: 80.00,
        selling_price: 120.00,
        quantity: 25,
        min_quantity: 10
      },
      {
        product_id: insertedProducts[1].id,
        sku: 'NIKE-AIR-MAX-9',
        name: 'Nike Air Max Size 9',
        cost_price: 80.00,
        selling_price: 120.00,
        quantity: 30,
        min_quantity: 10
      },
      {
        product_id: insertedProducts[1].id,
        sku: 'NIKE-AIR-MAX-10',
        name: 'Nike Air Max Size 10',
        cost_price: 80.00,
        selling_price: 120.00,
        quantity: 25,
        min_quantity: 10
      },
      {
        product_id: insertedProducts[1].id,
        sku: 'NIKE-AIR-MAX-11',
        name: 'Nike Air Max Size 11',
        cost_price: 80.00,
        selling_price: 120.00,
        quantity: 20,
        min_quantity: 10
      },
      // Book variants
      {
        product_id: insertedProducts[2].id,
        sku: 'BOOK-GATSBY-PB',
        name: 'The Great Gatsby Paperback',
        cost_price: 8.00,
        selling_price: 12.00,
        quantity: 100,
        min_quantity: 20
      },
      {
        product_id: insertedProducts[2].id,
        sku: 'BOOK-GATSBY-HC',
        name: 'The Great Gatsby Hardback',
        cost_price: 15.00,
        selling_price: 25.00,
        quantity: 50,
        min_quantity: 10
      },
      {
        product_id: insertedProducts[2].id,
        sku: 'BOOK-GATSBY-DIGITAL',
        name: 'The Great Gatsby Digital',
        cost_price: 5.00,
        selling_price: 9.99,
        quantity: 50,
        min_quantity: 5
      }
    ];

    const { data: insertedVariants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .insert(variants)
      .select();

    if (variantsError) {
      console.error('❌ Error adding variants:', variantsError);
      return;
    }

    console.log(`✅ Added ${insertedVariants?.length || 0} variants`);

    // Step 6: Add sample customers
    console.log('\n👥 Step 6: Adding customers...');
    const customers = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1234567890',
        total_spent: 1500.00,
        last_purchase_date: new Date().toISOString()
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1234567891',
        total_spent: 800.00,
        last_purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '+1234567892',
        total_spent: 2200.00,
        last_purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: insertedCustomers, error: customersError } = await supabase
      .from('lats_customers')
      .insert(customers)
      .select();

    if (customersError) {
      console.error('❌ Error adding customers:', customersError);
    } else {
      console.log(`✅ Added ${insertedCustomers?.length || 0} customers`);
    }

    // Step 7: Add sample sales transactions
    console.log('\n💰 Step 7: Adding sales transactions...');
    const transactions = [
      {
        customer_id: insertedCustomers[0].id,
        total_amount: 999.00,
        payment_method: 'credit_card',
        status: 'completed'
      },
      {
        customer_id: insertedCustomers[1].id,
        total_amount: 240.00,
        payment_method: 'cash',
        status: 'completed'
      },
      {
        customer_id: insertedCustomers[2].id,
        total_amount: 1299.00,
        payment_method: 'credit_card',
        status: 'completed'
      }
    ];

    const { data: insertedTransactions, error: transactionsError } = await supabase
      .from('lats_pos_transactions')
      .insert(transactions)
      .select();

    if (transactionsError) {
      console.error('❌ Error adding transactions:', transactionsError);
    } else {
      console.log(`✅ Added ${insertedTransactions?.length || 0} transactions`);
    }

    // Step 8: Calculate and display analytics
    console.log('\n📊 Step 8: Calculating analytics...');
    
    const totalVariants = insertedVariants?.length || 0;
    const totalStock = insertedVariants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
    const totalValue = insertedVariants?.reduce((sum, variant) => sum + ((variant.cost_price || 0) * (variant.quantity || 0)), 0) || 0;

    console.log('\n🎉 Sample data added successfully!');
    console.log('\n📊 Expected Analytics Results:');
    console.log(`  Total Variants: ${totalVariants}`);
    console.log(`  Total Stock: ${totalStock}`);
    console.log(`  Total Value: $${totalValue.toFixed(2)}`);
    console.log(`  Total Products: ${insertedProducts?.length || 0}`);
    console.log(`  Total Categories: ${insertedCategories?.length || 0}`);
    console.log(`  Total Brands: ${insertedBrands?.length || 0}`);
    console.log(`  Total Suppliers: ${insertedSuppliers?.length || 0}`);
    console.log(`  Total Customers: ${insertedCustomers?.length || 0}`);
    console.log(`  Total Transactions: ${insertedTransactions?.length || 0}`);

    console.log('\n✅ You can now test the analytics cards!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the script
addSampleAnalyticsData();
